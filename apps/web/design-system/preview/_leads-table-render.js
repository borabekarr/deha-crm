/* =========================================================================
   Deha CRM — Leads Table render + interactions + detail popover
   ========================================================================= */
(function(){
  const D = window.DEHA_LEADS;
  const { LEADS, STAGES, STAGE_ORDER, SOURCES } = D;
  const { $,$$,esc,initials,fmtTL,rel,health,healthClr,healthAv } = D.helpers;

  /* ── state ── */
  const state = { search:'', qf:null, sortKey:'score', sortDir:'desc', page:1, perPage:8, expanded:false, openId:null };
  const opened = new Set(); // leads whose popover has animated once

  const body = $('#ltBody');

  /* ── analytics header ── */
  function renderAnalytics(){
    // pipeline distribution
    const byStage = {};
    STAGE_ORDER.forEach(s=> byStage[s]={count:0, value:0});
    LEADS.forEach(l=>{ byStage[l.stage].count++; byStage[l.stage].value += (l.value||0); });
    const maxVal = Math.max(...STAGE_ORDER.map(s=>byStage[s].value), 1);
    const totalVal = STAGE_ORDER.reduce((a,s)=>a+byStage[s].value,0);
    const host = $('#ltPipeDist');
    const stack = STAGE_ORDER.map(s=>{ const st=STAGES[s], d=byStage[s]; const pct=d.value/totalVal*100; return pct>0?`<span class="lt-pipe-seg" style="width:${pct.toFixed(1)}%;background:${st.dot}"></span>`:''; }).join('');
    const legend = STAGE_ORDER.map(s=>{ const st=STAGES[s], d=byStage[s]; return `<div class="lt-pipe-row">
        <span><span class="lt-stage-chip" style="background:${st.bg};color:${st.clr}"><span class="d" style="background:${st.dot}"></span>${st.label}</span></span>
        <span class="lt-pipe-count">${d.count}</span>
        <span class="vl">${fmtTL(d.value)}</span>
      </div>`; }).join('');
    host.innerHTML = `<div class="lt-pipe-stack">${stack}</div>${legend}
      <div class="lt-pipe-foot">
        <div><div class="k">Total pipeline</div><div class="v">${fmtTL(totalVal)}</div></div>
        <div style="text-align:right"><div class="k">Active leads</div><div class="v" style="font-size:20px">${LEADS.length}</div></div>
      </div>`;

    // metric cards
    const wins = LEADS.filter(l=>l.stage==='closing').length;
    const avgScore = Math.round(LEADS.reduce((a,l)=>a+l.score,0)/LEADS.length);
    const dealVals = LEADS.filter(l=>l.value).map(l=>l.value);
    const avgDeal = dealVals.reduce((a,v)=>a+v,0)/dealVals.length;
    const metrics = [
      {k:'Win rate · 90d', v:'58%', t:'up', tv:'3 pts this week'},
      {k:'Avg AI score', v:avgScore, t:'up', tv:'5 vs last month'},
      {k:'Avg deal size', v:fmtTL(avgDeal), t:'flat', tv:'flat this qtr'},
      {k:'Avg days to close', v:'34d', t:'down', tv:'12d vs last qtr'}
    ];
    $('#ltMetrics').innerHTML = metrics.map(m=>`
      <div class="lt-metric">
        <div class="mk">${m.k}</div>
        <div class="mv">${m.v}</div>
        <div class="mt ${m.t}"><span class="material-symbols-outlined">${m.t==='up'?'trending_up':m.t==='down'?'trending_down':'trending_flat'}</span>${m.tv}</div>
      </div>`).join('');
  }

  /* ── filter + sort ── */
  function filtered(){
    let rows = LEADS.filter(l=>{
      if (state.qf==='hot' && l.temp!=='hot') return false;
      if (state.qf==='value' && (!l.value || l.value < 1800000)) return false;
      if (state.qf==='earn' && l.score < 65) return false;
      if (state.search){
        const q = state.search.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !l.co.toLowerCase().includes(q) &&
            !STAGES[l.stage].label.toLowerCase().includes(q) && !l.temp.includes(q)) return false;
      }
      return true;
    });
    const dir = state.sortDir==='asc'?1:-1;
    const key = state.sortKey;
    rows.sort((a,b)=>{
      let av,bv;
      if (key==='value'){ av=a.value||-1; bv=b.value||-1; }
      else if (key==='last'){ av=-a.last; bv=-b.last; } // recent first when desc
      else { av=a[key]; bv=b[key]; }
      return (av-bv)*dir;
    });
    return rows;
  }

  /* ── cell builders ── */
  function scoreCell(l){
    const h = health(l.score), clr = healthClr(h);
    const perfect = l.score>=100;
    return `<div class="lt-td col-num">
      <div class="lt-score-v" style="color:${clr}">${l.score}%${perfect?'<span class="material-symbols-outlined">check_circle</span>':''}</div>
      <span class="lt-bar"><span class="lt-bar-fill" style="width:${l.score}%;background:${clr}"></span></span>
    </div>`;
  }
  function sentCell(l){
    const s = l.sentiment;
    let emoji, label, bg, lite=false;
    if (s>=75){ emoji='😄'; label='Happy';    bg='#10B981'; }
    else if (s>=60){ emoji='🙂'; label='Positive'; bg='#10B981'; }
    else if (s>=45){ emoji='😐'; label='Neutral';  bg='#EAB308'; lite=true; }
    else { emoji='🙁'; label='Unhappy';  bg='#EF4444'; }
    return `<div class="lt-td"><span class="lt-tag${lite?' lite':''}" style="background:${bg}"><span class="lt-emoji">${emoji}</span>${label}</span></div>`;
  }
  const STAGE_ICONS = { lead:'person_add', qualified:'verified', proposal:'description', negotiation:'handshake', closing:'task_alt' };
  const SRC_COLORS  = { paid:'#F59E0B', organic:'#3B82F6', referral:'#14B8A6' };
  function rowHTML(l){
    const h = health(l.score), st = STAGES[l.stage], src = SOURCES[l.source];
    const stale = l.last >= 7*1440;
    const whenTxt = l.last < 50 ? 'today' : rel(l.last);
    const stLite = l.stage==='proposal';
    const srcLite = src.kind==='paid';
    const tempBg = l.temp==='hot'?'#F97316':l.temp==='warm'?'#EAB308':'#64748B';
    const tempIcon = l.temp==='hot'?'local_fire_department':l.temp==='warm'?'thermostat':'ac_unit';
    return `
      <div class="lt-td lt-lead">
        <span class="lt-av" style="background:${healthAv(h)}"></span>
        <span class="lt-lead-meta">
          <span class="lt-lead-name">${esc(l.name)}</span>
          <span class="lt-lead-co">${esc(l.co)}</span>
        </span>
      </div>
      ${scoreCell(l)}
      <div class="lt-td lt-value">
        <span class="vv">${l.value?fmtTL(l.value):'<span class="dash">—</span>'}</span>
        ${l.value?`<span class="vl"><span class="material-symbols-outlined">savings</span>LTV ${fmtTL(l.ltv)}</span>`:`<span class="vl">no value yet</span>`}
      </div>
      <div class="lt-td"><span class="lt-tag${stLite?' lite':''}" style="background:${st.dot}"><span class="material-symbols-outlined">${STAGE_ICONS[l.stage]}</span>${st.label}</span></div>
      ${sentCell(l)}
      <div class="lt-td"><span class="lt-tag${srcLite?' lite':''}" style="background:${SRC_COLORS[src.kind]}"><span class="material-symbols-outlined">${src.icon}</span>${src.label}</span></div>
      <div class="lt-td"><span class="lt-when ${stale?'stale':''}">${whenTxt}</span></div>
      <div class="lt-td"><span class="lt-tag${l.temp==='warm'?' lite':''}" style="background:${tempBg}"><span class="material-symbols-outlined">${tempIcon}</span>${l.temp}</span></div>`;
  }

  /* ── render table ── */
  function render(animate){
    const rows = filtered();
    const total = rows.length;
    const filterActive = !!state.qf;
    let shown;
    if (filterActive){ shown = rows; }
    else if (!state.expanded){ shown = rows.slice(0,4); }
    else {
      const start = (state.page-1)*state.perPage;
      shown = rows.slice(start, start+state.perPage);
    }

    body.innerHTML = '';
    if (!shown.length){
      body.innerHTML = `<div class="lt-empty">
        <div class="lt-empty-ic"><span class="material-symbols-outlined">person_search</span></div>
        <div class="lt-empty-t">No leads match this filter</div>
        <div class="lt-empty-s">Try a different quick filter or clear your search to see the full pipeline.</div>
        <div class="lt-empty-btns">
          <button class="lt-btn" id="ltEmptyClear"><span class="material-symbols-outlined">filter_alt_off</span>Clear filters</button>
          <button class="lt-btn lt-btn-ai" id="ltEmptyAsk"><span class="material-symbols-outlined">bolt</span>Ask AI</button>
        </div>
      </div>`;
      $('#ltEmptyClear').addEventListener('click', clearAll);
      $('#ltEmptyAsk').addEventListener('click', ()=> toast('Asking AI to surface leads…'));
      renderFooter(total, filterActive, rows.length);
      return;
    }

    const frag = document.createDocumentFragment();
    shown.forEach((l,i)=>{
      const wrap = document.createElement('div');
      wrap.className = 'lt-rowwrap' + (state.openId===l.id?' active':'');
      wrap.dataset.id = l.id;
      const row = document.createElement('div');
      row.className = 'lt-row lt-grid';
      row.innerHTML = rowHTML(l);
      wrap.appendChild(row);
      if (animate!==false){ row.classList.add('enter'); row.style.setProperty('--d', Math.min(i*30,300)+'ms'); }
      frag.appendChild(wrap);
    });
    body.appendChild(frag);

    if (animate!==false){
      setTimeout(()=> $$('.lt-row.enter',body).forEach(r=> r.style.transform='none'), 30);
    }

    renderFooter(total, filterActive, rows.length);
  }

  /* ── footer: view-more or pagination ── */
  function renderFooter(total, filterActive, filteredLen){
    const vmWrap = $('#ltViewMoreWrap'), foot = $('#ltFoot');
    if (filterActive){
      vmWrap.style.display='none'; foot.style.display='flex';
      $('#ltFootInfo').innerHTML = `Showing <b>${filteredLen}</b> matching lead${filteredLen===1?'':'s'}`;
      $('#ltPages').innerHTML='';
      return;
    }
    if (!state.expanded){
      foot.style.display='none';
      if (total>4){ vmWrap.style.display='block'; $('#ltViewMoreCount').textContent = `${total-4} of ${total}`; }
      else { vmWrap.style.display='none'; }
      return;
    }
    vmWrap.style.display='none'; foot.style.display='flex';
    const pages = Math.max(1, Math.ceil(total/state.perPage));
    if (state.page>pages) state.page=pages;
    const start=(state.page-1)*state.perPage;
    $('#ltFootInfo').innerHTML = `<b>${start+1}–${Math.min(start+state.perPage,total)}</b> of <b>${total}</b> leads`;
    const host=$('#ltPages'); host.innerHTML='';
    const add=(label,opts={})=>{ const b=document.createElement('button'); b.className='lt-pg'+(opts.cls?' '+opts.cls:''); b.innerHTML=label; if(opts.dis)b.disabled=true; if(opts.go!=null&&!opts.dis) b.addEventListener('click',()=>{ if(opts.go!==state.page){ state.page=opts.go; closePopover(); transition(); } }); host.appendChild(b); };
    add('<span class="material-symbols-outlined">chevron_left</span>',{cls:'nav',dis:state.page===1,go:state.page-1});
    for(let p=1;p<=pages;p++){ if(p===1||p===pages||(p>=state.page-1&&p<=state.page+1)) add(String(p),{cls:p===state.page?'cur':'',go:p}); else if(host.lastChild && !host.lastChild.classList.contains('ell')) add('…',{cls:'ell'}); }
    add('<span class="material-symbols-outlined">chevron_right</span>',{cls:'nav',dis:state.page===pages,go:state.page+1});
  }

  function transition(){ body.classList.add('fading'); setTimeout(()=>{ render(); body.classList.remove('fading'); }, 150); }

  /* ════════════════════════════════════════════════════════════════════
     DETAIL POPOVER
     ════════════════════════════════════════════════════════════════════ */
  function chip(txt,icon,style){ return `<span class="lt-stage-chip" style="${style}">${icon?`<span class="material-symbols-outlined" style="font-size:13px">${icon}</span>`:''}${txt}</span>`; }

  function popHTML(l){
    const h = health(l.score), clr=healthClr(h), st=STAGES[l.stage], src=SOURCES[l.source];
    const sH = health(l.sentiment), sClr=healthClr(sH);
    const eH = health(l.engagement), eClr=healthClr(eH);
    const early = l.age3;
    // pipeline tracker
    const curIdx = STAGE_ORDER.indexOf(l.stage);
    const track = STAGE_ORDER.map((s,i)=>{
      const done=i<curIdx, cur=i===curIdx;
      return `<div class="lt-tstep ${done?'done':''} ${cur?'cur':''}" style="--di:${i*0.07}s">
        <span class="lt-tdot" style="animation-delay:${i*0.07}s">${done?'<span class="material-symbols-outlined" style="font-size:13px">check</span>':cur?'<span class="material-symbols-outlined" style="font-size:12px">radio_button_checked</span>':'<span class="material-symbols-outlined" style="font-size:12px">circle</span>'}</span>
        <span class="tl">${STAGES[s].label}</span>
      </div>`;
    }).join('');
    const connPct = curIdx/(STAGE_ORDER.length-1)*86;
    // factor bars
    const factors = l.factors.map(([n,w])=>`
      <div class="lt-factor">
        <div class="lt-factor-top"><span class="fn">${n}</span><span class="fw">${w}%</span></div>
        <span class="lt-bar"><span class="lt-bar-fill" style="width:${w}%;background:${clr}"></span></span>
      </div>`).join('');
    // contact freq
    const maxF = Math.max(...l.freq,1);
    const freqLabels=['3w','2w','1w','Now'];
    const freq = l.freq.map((v,i)=>`
      <div class="lt-fbar-col">
        <span class="lt-fbar" data-h="${Math.round(v/maxF*100)}" style="height:${Math.round(v/maxF*100)}%;background:${v===0?'var(--track)':eClr};transition-delay:${i*50}ms"></span>
        <span class="lt-fbar-l">${freqLabels[i]}</span>
      </div>`).join('');
    // signals
    const sigIcon = t => t==='pos'?'trending_up':t==='neg'?'trending_down':'warning';
    const signals = l.signals.map((s,i)=>`<div class="lt-signal ${s[0]}" style="--si:${i*40}ms"><span class="material-symbols-outlined">${sigIcon(s[0])}</span><span class="st">${esc(s[1])}</span></div>`).join('');
    // engagement ring
    const R=30, C=2*Math.PI*R, off=C*(1-l.engagement/100);
    const ring = `<div class="lt-ring">
        <svg width="74" height="74" viewBox="0 0 74 74">
          <circle cx="37" cy="37" r="${R}" fill="none" stroke="var(--track)" stroke-width="7"/>
          <circle class="lt-ring-arc" cx="37" cy="37" r="${R}" fill="none" stroke="${eClr}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
        </svg>
        <div class="rv"><b>${l.engagement}</b><span>Engaged</span></div>
      </div>`;
    const engCmp = l.engagement>=l.engAvg;
    // predicted close
    const closeHtml = l.close ? (l.close.conf!=null
      ? `<div class="pv">${l.close.range}</div><div class="ps">${l.close.conf}% confidence</div>`
      : `<div class="pv" style="color:var(--txt3)">${l.close.range}</div><div class="ps">Need more activity to forecast</div>`)
      : `<div class="pv" style="color:var(--txt3)">Insufficient data</div><div class="ps">Re-qualify to enable forecast</div>`;
    // velocity
    const velIcon = l.vel==='fast'?'bolt':l.vel==='moderate'?'schedule':'hourglass_empty';
    const velLabel = l.vel.charAt(0).toUpperCase()+l.vel.slice(1);
    // profile
    const reqs = l.profile.reqs.length ? `<div class="lt-reqs">${l.profile.reqs.map(r=>`<span class="lt-req">${esc(r)}</span>`).join('')}</div>` : `<div class="lt-nodata">None recorded yet</div>`;
    // recommendations
    const nba = l.nba.map(a=>`
      <div class="lt-nba ${a.p?'primary':''}">
        <span class="lt-nba-rank">${a.p?'<span class="material-symbols-outlined" style="font-size:13px">star</span>':'·'}</span>
        <div class="lt-nba-body"><div class="nt">${esc(a.t)}</div><div class="nr">${esc(a.r)}</div></div>
        <span class="lt-nba-go material-symbols-outlined" style="color:var(--txt4);font-size:18px">chevron_right</span>
      </div>`).join('');
    const obj = l.obj.length ? l.obj.map(o=>`
      <div class="lt-obj"><span class="material-symbols-outlined">shield</span>
        <div><div class="ot">${esc(o.o)}</div><div class="oa">→ <b>${esc(o.a)}</b></div></div>
      </div>`).join('') : `<div class="lt-nodata">No objections detected in conversations yet.</div>`;
    const matches = l.matches.length ? l.matches.map(m=>`
      <div class="lt-match">
        <span class="lt-match-pic"><span class="material-symbols-outlined">apartment</span></span>
        <div class="lt-match-body"><div class="lt-match-name">${esc(m.n)}</div><div class="lt-match-meta">${esc(m.m2)} · ${esc(m.area)} · ${esc(m.r)}</div></div>
        <span class="lt-match-pct">${m.pct}%</span>
        <button class="lt-match-share" data-share="${esc(m.n)}"><span class="material-symbols-outlined">share</span>Share</button>
      </div>`).join('') : `<div class="lt-nodata">Not enough stated criteria to match listings yet.</div>`;
    // activity
    const acts = l.acts.map(a=>`
      <div class="lt-tl-item">
        <span class="lt-tl-ic"><span class="material-symbols-outlined">${a.ic}</span></span>
        <div class="lt-tl-body">
          <div class="lt-tl-desc">${esc(a.t)}</div>
          <div class="lt-tl-time">${esc(a.tm)}</div>
          ${a.sum?`<div class="lt-tl-sum"><span class="material-symbols-outlined">auto_awesome</span><span class="ts">${esc(a.sum)}</span></div>`:''}
        </div>
      </div>`).join('');
    const earlyTag = early?`<span class="lt-early">early</span>`:'';

    return `<div class="lt-pop-inner"><div class="lt-pop-card">
      <!-- hero -->
      <div class="lt-pop-hero">
        <div class="lt-pop-hero-l">
          <div class="lt-pop-id">
            <span class="lt-pop-av" style="background:${healthAv(h)}">${initials(l.name)}</span>
            <div><div class="lt-pop-name">${esc(l.name)}</div><div class="lt-pop-co">${esc(l.co)}</div></div>
          </div>
          <div class="lt-pop-contact">
            <button class="lt-contact-btn"><span class="material-symbols-outlined">call</span>${esc(l.phone)}</button>
            <button class="lt-contact-btn"><span class="material-symbols-outlined">mail</span>Email</button>
            <button class="lt-contact-btn wa"><span class="material-symbols-outlined">chat</span>WhatsApp</button>
          </div>
          <div class="lt-bestcall"><span class="material-symbols-outlined">schedule</span>Best window: ${esc(l.nba[0]&&l.nba[0].t.includes(':')?l.nba[0].t.replace(/^(Call|Send|Offer|Book)\s*/,''):'Tue 11:00–13:00')}</div>
          <div class="lt-pop-chips">
            ${chip(st.label,null,`background:${st.bg};color:${st.clr}`)}
            ${chip(l.temp.toUpperCase(),l.temp==='hot'?'local_fire_department':l.temp==='warm'?'thermostat':'ac_unit',`background:${l.temp==='hot'?'var(--orange-bg)':l.temp==='warm'?'var(--a-bg)':'var(--chip)'};color:${l.temp==='hot'?'var(--orange)':l.temp==='warm'?'var(--a)':'var(--txt3)'}`)}
            ${chip(src.label,src.icon,`background:${src.kind==='paid'?'var(--a-bg)':src.kind==='organic'?'var(--blue-bg)':'var(--teal-bg)'};color:${src.kind==='paid'?'var(--a)':src.kind==='organic'?'var(--blue)':'var(--teal)'}`)}
            ${chip(velLabel+' responder',velIcon,`background:var(--panel);color:var(--txt2);border:1px solid var(--panel-bd)`)}
          </div>
        </div>
        <div class="lt-pop-hero-r">
          <div class="lt-metricbox">
            <div class="mk">Win probability ${earlyTag}</div>
            <div class="mv" style="color:${clr}">${l.score}%</div>
            <span class="lt-bar"><span class="lt-bar-fill" style="width:${l.score}%;background:${clr}"></span></span>
          </div>
          <div class="lt-metricbox sm">
            <div class="mk">Sentiment ${earlyTag}</div>
            <div class="mv" style="color:${sClr}">${l.sentiment}</div>
            <span class="lt-bar"><span class="lt-bar-fill" style="width:${l.sentiment}%;background:${sClr}"></span></span>
          </div>
          <div class="lt-pop-deal">
            <div class="dv">${l.value?fmtTL(l.value):'No deal value yet'}</div>
            <div class="dl">${l.value?`LTV est. ${fmtTL(l.ltv)}`:'Awaiting qualification'} · ${l.age}d in pipeline</div>
          </div>
        </div>
      </div>

      <!-- ai summary -->
      <div class="lt-ai-summary"><span class="material-symbols-outlined">auto_awesome</span><span class="txt" data-summary>${esc(summaryFor(l))}</span></div>

      <!-- pipeline tracker -->
      <div class="lt-sec">
        <div class="lt-sec-t"><span class="material-symbols-outlined">timeline</span>Pipeline progress</div>
        <div class="lt-track">
          <span class="conn"></span><span class="conn-fill" style="width:${connPct}%"></span>
          ${track}
        </div>
      </div>

      <!-- ai intelligence 2x2 -->
      <div class="lt-sec">
        <div class="lt-sec-t"><span class="material-symbols-outlined">neurology</span>AI intelligence</div>
        <div class="lt-intel">
          <div class="lt-icell">
            <div class="lt-icell-t">Engagement index</div>
            <div class="lt-ring-row">${ring}
              <div class="lt-ring-info"><b>${l.engagement}</b> / 100 overall<div class="cmp" style="color:${engCmp?'var(--g)':'var(--r)'}"><span class="material-symbols-outlined">${engCmp?'arrow_upward':'arrow_downward'}</span>${engCmp?'Above':'Below'} pipeline avg (${l.engAvg})</div></div>
            </div>
          </div>
          <div class="lt-icell">
            <div class="lt-icell-t">Win probability factors</div>
            ${factors}
          </div>
          <div class="lt-icell">
            <div class="lt-icell-t">Contact frequency</div>
            <div class="lt-freq">${freq}</div>
            <div class="lt-freq-note">This week: <b>${l.freqNote} contact${l.freqNote===1?'':'s'}</b>${l.freq[3]===0?' — went quiet':''}</div>
          </div>
          <div class="lt-icell">
            <div class="lt-icell-t">AI signals</div>
            ${signals}
          </div>
        </div>
      </div>

      <!-- predicted close + velocity -->
      <div class="lt-sec">
        <div class="lt-two">
          <div class="lt-pcell"><div class="pk"><span class="material-symbols-outlined">event_available</span>Predicted close</div>${closeHtml}</div>
          <div class="lt-pcell"><div class="pk"><span class="material-symbols-outlined">speed</span>Response velocity</div>
            <span class="lt-velbadge ${l.vel}"><span class="material-symbols-outlined">${velIcon}</span>${velLabel}</span>
            <div class="ps" style="margin-top:7px">Avg response: ${esc(l.velAvg)}</div>
          </div>
        </div>
      </div>

      <!-- suggested next step -->
      <div class="lt-nextstep">
        <div class="ns-k"><span class="material-symbols-outlined">auto_awesome</span>AI recommendation</div>
        <div class="ns-t">${esc(l.next)}</div>
      </div>

      <!-- customer profile -->
      <div class="lt-sec">
        <div class="lt-sec-t"><span class="material-symbols-outlined">badge</span>Customer profile</div>
        <div class="lt-profile">
          <div class="lt-pf"><div class="pfk"><span class="material-symbols-outlined">paid</span>Budget</div><div class="pfv">${esc(l.profile.budget)}<span class="conf">${esc(l.profile.budgetConf)} conf.</span></div></div>
          <div class="lt-pf"><div class="pfk"><span class="material-symbols-outlined">target</span>Motivation</div><div class="pfv">${esc(l.profile.motivation)}</div></div>
          <div class="lt-pf"><div class="pfk"><span class="material-symbols-outlined">home_work</span>Property</div><div class="pfv">${esc(l.profile.type)} · ${esc(l.profile.size)} · ${esc(l.profile.rooms)}</div></div>
          <div class="lt-pf"><div class="pfk"><span class="material-symbols-outlined">groups</span>Decision</div><div class="pfv">${esc(l.profile.decision)}</div></div>
          <div class="lt-pf"><div class="pfk"><span class="material-symbols-outlined">account_balance</span>Financing</div><div class="pfv">${esc(l.profile.financing)}</div></div>
          <div class="lt-pf"><div class="pfk"><span class="material-symbols-outlined">schedule</span>Timeline</div><div class="pfv">${esc(l.profile.timeline)}</div></div>
          <div class="lt-pf wide"><div class="pfk"><span class="material-symbols-outlined">location_on</span>Location preferences</div><div class="pfv">${esc(l.profile.locations)}</div></div>
          <div class="lt-pf wide"><div class="pfk"><span class="material-symbols-outlined">checklist</span>Special requirements</div>${reqs}</div>
          <div class="lt-pf wide"><div class="pfk"><span class="material-symbols-outlined">edit_note</span>Notes <span style="margin-left:auto;font-weight:600;text-transform:none;letter-spacing:0;color:var(--txt5)">click to edit</span></div><div class="lt-note" contenteditable="true" spellcheck="false">${esc(noteFor(l))}</div></div>
        </div>
      </div>

      <!-- recommendations -->
      <div class="lt-sec">
        <div class="lt-sec-t"><span class="material-symbols-outlined">recommend</span>AI recommendations</div>
        <div class="lt-rec-sub">Next best actions <span class="boost"><span class="material-symbols-outlined">bolt</span>Contact today: +${l.boost}% close prob.</span></div>
        ${nba}
        <div class="lt-rec-sub" style="margin-top:16px">Objection map</div>
        ${obj}
        <div class="lt-rec-sub" style="margin-top:16px">Property matches</div>
        <div class="lt-matches">${matches}</div>
      </div>

      <!-- activity -->
      <div class="lt-sec">
        <div class="lt-sec-t"><span class="material-symbols-outlined">history</span>Activity feed
          <button class="lt-act-add lt-act-filter" data-addnote><span class="material-symbols-outlined" style="font-size:13px;vertical-align:-2px">add</span> Add note</button>
        </div>
        <div class="lt-act-filters">
          <button class="lt-act-filter on">All</button>
          <button class="lt-act-filter">Calls</button>
          <button class="lt-act-filter">Email</button>
          <button class="lt-act-filter">WhatsApp</button>
          <button class="lt-act-filter">Notes</button>
        </div>
        <div class="lt-tl">${acts}</div>
      </div>

      <!-- footer actions -->
      <div class="lt-pop-foot">
        <button class="lt-btn lt-btn-ai" data-askai><span class="material-symbols-outlined">bolt</span>Ask AI about ${esc(l.name.split(' ')[0])}</button>
        <button class="lt-contact-btn"><span class="material-symbols-outlined">call</span>Call</button>
        <button class="lt-contact-btn"><span class="material-symbols-outlined">mail</span>Email</button>
        <button class="lt-contact-btn wa"><span class="material-symbols-outlined">chat</span>WhatsApp</button>
        <span class="grow"></span>
        <button class="lt-fbtn-link" data-fullrecord>Full record<span class="material-symbols-outlined">arrow_forward</span></button>
        <button class="lt-fbtn-link" data-closepop><span class="material-symbols-outlined">close</span>Close</button>
      </div>
    </div></div>`;
  }

  function summaryFor(l){
    const h=health(l.score);
    if (l.age3) return `Brand-new lead, only ${l.age} days in — early signals look ${h==='g'?'promising':'okay'} and she replies fast. Lock a discovery call before she shops around.`;
    if (h==='g') return `Strong, active deal. ${l.name.split(' ')[0]} is engaged and progressing — the main job now is removing the last bit of friction and keeping momentum toward close.`;
    if (h==='a') return `Warm but undecided. ${l.name.split(' ')[0]} is interested yet hasn't committed — a concrete next step (a viewing, a clear comparison) is what moves this forward.`;
    return `Cooling off. ${l.name.split(' ')[0]} has gone quiet and signals are weakening — re-qualify with one low-effort touch before investing more agent time.`;
  }
  function noteFor(l){
    const notes={1:'Loved the terrace on the villa tour. Price-sensitive — frame around lifestyle, not numbers.',2:'Lawyer engaged, very close. Keep paperwork tight.',7:'Repeat buyer, easy to work with. Ask for the referral.'};
    return notes[l.id] || 'No notes yet — add context for the next touch.';
  }

  /* ── popover motion ── */
  function animatePopover(wrap, instant){
    const pop = wrap.querySelector('.lt-pop'); if(!pop) return;
    // typewriter summary (timer-based — robust)
    const sm = pop.querySelector('[data-summary]');
    if (sm && !instant){
      const full=sm.textContent; sm.textContent=''; sm.classList.add('lt-caret'); let i=0;
      const tick=()=>{ if(i<=full.length){ sm.textContent=full.slice(0,i); i++; setTimeout(tick, 16);} else sm.classList.remove('lt-caret'); };
      setTimeout(tick, 260);
    }
    // wire popover buttons
    pop.querySelector('[data-closepop]')?.addEventListener('click',(e)=>{ e.stopPropagation(); closePopover(); });
    pop.querySelector('[data-askai]')?.addEventListener('click',(e)=>{ e.stopPropagation(); const l=LEADS.find(x=>x.id===state.openId); toast(`Opening AI chat about ${l.name} (score ${l.score}%, last ${rel(l.last)})…`); });
    pop.querySelector('[data-fullrecord]')?.addEventListener('click',(e)=>{ e.stopPropagation(); toast('Opening full record…'); });
    pop.querySelector('[data-addnote]')?.addEventListener('click',(e)=>{ e.stopPropagation(); const n=pop.querySelector('.lt-note'); if(n){ n.focus(); } });
    $$('[data-share]',pop).forEach(b=> b.addEventListener('click',(e)=>{ e.stopPropagation(); toast(`WhatsApp draft ready for “${b.dataset.share}”`); }));
    $$('.lt-contact-btn',pop).forEach(b=> b.addEventListener('click',e=>e.stopPropagation()));
    $$('.lt-act-filter',pop).forEach(b=> b.addEventListener('click',e=>{ e.stopPropagation(); if(b.hasAttribute('data-addnote'))return; pop.querySelectorAll('.lt-act-filter:not([data-addnote])').forEach(x=>x.classList.remove('on')); b.classList.add('on'); }));
    pop.querySelectorAll('.lt-note').forEach(n=> n.addEventListener('click',e=>e.stopPropagation()));
  }

  /* The lead detail now opens as a centered popover modal (React, schema +
     tier driven) — see _lead-popover.jsx. These bridge to it and keep the
     clicked row highlighted while it's open. */
  function openPopover(id){
    const l = LEADS.find(x=>x.id===id); if(!l) return;
    if (state.openId===id){ closePopover(); return; }
    const prev=state.openId; state.openId=id;
    if (prev!=null){ const pw=$(`.lt-rowwrap[data-id="${prev}"]`,body); if(pw) pw.classList.remove('active'); }
    const wrap=$(`.lt-rowwrap[data-id="${id}"]`,body); if(wrap) wrap.classList.add('active');
    if (window.__openLeadPopover) window.__openLeadPopover(l);
  }
  function closePopover(){
    if (state.openId==null) return;
    const wrap=$(`.lt-rowwrap[data-id="${state.openId}"]`,body); if(wrap) wrap.classList.remove('active');
    state.openId=null;
    if (window.__closeLeadPopover) window.__closeLeadPopover();
  }
  // React notifies us when the user closes the modal (Esc / backdrop / X)
  window.__ltOnLeadPopoverClosed = function(){
    if (state.openId==null) return;
    const wrap=$(`.lt-rowwrap[data-id="${state.openId}"]`,body); if(wrap) wrap.classList.remove('active');
    state.openId=null;
  };

  /* ── row click ── */
  body.addEventListener('click', e=>{
    const row=e.target.closest('.lt-row'); if(!row) return;
    const wrap=row.closest('.lt-rowwrap'); const id=parseInt(wrap.dataset.id,10);
    openPopover(id);
  });

  /* ── quick filters ── */
  $$('.lt-qf').forEach(b=>{
    b.addEventListener('click', ()=>{
      const f=b.dataset.qf;
      state.qf = state.qf===f ? null : f;
      state.page=1; closePopover();
      $$('.lt-qf').forEach(x=> x.classList.toggle('on', x.dataset.qf===state.qf));
      $('#ltClear').classList.toggle('show', !!state.qf || !!state.search);
      transition();
    });
  });
  $('#ltClear').addEventListener('click', clearAll);
  function clearAll(){
    state.qf=null; state.search=''; state.page=1; closePopover();
    $('#ltSearch').value='';
    $$('.lt-qf').forEach(x=>x.classList.remove('on'));
    $('#ltClear').classList.remove('show');
    transition();
  }

  /* ── search ── */
  let searchT;
  $('#ltSearch').addEventListener('input', e=>{
    state.search=e.target.value.trim(); state.page=1;
    $('#ltClear').classList.toggle('show', !!state.qf || !!state.search);
    clearTimeout(searchT); searchT=setTimeout(()=>{ closePopover(); render(); }, 140);
  });
  $('#ltFilterBtn').addEventListener('click', ()=>{ if(state.search) toast(`AI parsing: “${state.search}”…`); else $('#ltSearch').focus(); });
  $('#ltAskBtn').addEventListener('click', ()=> toast('Running full pipeline analysis…'));

  /* ── sort ── */
  $$('.lt-th.sortable').forEach(th=>{
    th.addEventListener('click', ()=>{
      const k=th.dataset.sort;
      if (state.sortKey===k){ state.sortDir = state.sortDir==='asc'?'desc':'asc'; }
      else { state.sortKey=k; state.sortDir = k==='last'?'desc':'desc'; }
      $$('.lt-th.sortable').forEach(t=>{ t.classList.toggle('sorted', t.dataset.sort===state.sortKey); t.classList.toggle('desc', t.dataset.sort===state.sortKey && state.sortDir==='asc'); });
      closePopover(); transition();
    });
  });

  /* ── view more ── */
  $('#ltViewMore').addEventListener('click', ()=>{ state.expanded=true; state.page=1; transition(); });

  /* ── toast ── */
  const toastEl=$('#ltToast'); let toastT;
  function toast(msg){ $('#ltToastMsg').textContent=msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove('show'),2800); }
  window.__ltToast = toast;

  // print hook: expand to show every lead in one continuous flow (no pagination)
  window.__ltExpandAllForPrint = function(){ state.qf=null; state.search=''; state.expanded=true; state.perPage=9999; state.page=1; state.openId=null; render(false); };

  $('#ltDensity')?.addEventListener('click', ()=>{ document.querySelector('.lt-app').classList.toggle('compact'); toast('Density toggled'); });
  $('#ltCols')?.addEventListener('click', ()=> toast('Column picker — coming soon'));

  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closePopover(); });

  /* ── init: skeleton → data ── */
  function skeleton(){
    body.innerHTML='';
    for(let i=0;i<4;i++){
      const w=document.createElement('div'); w.className='lt-rowwrap';
      const r=document.createElement('div'); r.className='lt-row lt-grid';
      r.innerHTML=`
        <div class="lt-td lt-lead"><span class="lt-skel-av"></span><span style="flex:1"><span class="lt-skel-bar" style="width:${55+i*8}%;display:block"></span><span class="lt-skel-bar" style="width:38%;height:8px;margin-top:6px;display:block"></span></span></div>
        <div class="lt-td"><span class="lt-skel-bar" style="width:60%"></span></div>
        <div class="lt-td"><span class="lt-skel-bar" style="width:70%"></span></div>
        <div class="lt-td"><span class="lt-skel-bar" style="width:64%"></span></div>
        <div class="lt-td"><span class="lt-skel-bar" style="width:50%"></span></div>
        <div class="lt-td"><span class="lt-skel-bar" style="width:66%"></span></div>
        <div class="lt-td"><span class="lt-skel-bar" style="width:54%"></span></div>
        <div class="lt-td"><span class="lt-skel-bar" style="width:58%"></span></div>`;
      w.appendChild(r); body.appendChild(w);
    }
  }
  $$('.lt-th.sortable').forEach(t=>{ if(t.dataset.sort==='score'){ t.classList.add('sorted'); } });
  skeleton();
  setTimeout(()=> render(), 360);
})();
