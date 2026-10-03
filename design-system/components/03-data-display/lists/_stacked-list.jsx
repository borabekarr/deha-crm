/* =========================================================================
   Stacked List — Deha Design System
   A member directory: an "Active Members" panel with a floating dock that
   springs open to reveal the full, searchable roster. Avatars use the
   signature glossy grid-textured treatment; rows sweep in on a stagger.
   ========================================================================= */

const { useState, useMemo, useEffect } = React;

/* ----------------------------- data ----------------------------- */
const ROLES = {
  pm:       { label: 'Project Manager',  icon: 'work',     tone: 'pm' },
  designer: { label: 'Designer',         icon: 'palette',  tone: 'designer' },
  data:     { label: 'Data Specialist',  icon: 'database', tone: 'data' },
  creator:  { label: 'Creator',          icon: 'stylus',   tone: 'creator' },
};

const MEMBERS = [
  { id: '01', name: 'Oliver Smith',  initials: 'OS', online: true,  status: 'Online',  role: 'pm',       color: '#059669' },
  { id: '02', name: 'Sophie Chen',   initials: 'SC', online: false, status: '17m ago', role: 'designer', color: '#475569' },
  { id: '03', name: 'Noah Wilson',   initials: 'NW', online: false, status: '29m ago', role: 'data',     color: '#F59E0B' },
  { id: '04', name: 'Emma Davis',    initials: 'ED', online: false, status: '48m ago', role: 'creator',  color: '#F97316' },
  { id: '05', name: 'Leo Garcia',    initials: 'LG', online: true,  status: 'Online',  role: 'designer', color: '#047857' },
  { id: '06', name: 'Mia Thompson',  initials: 'MT', online: true,  status: 'Online',  role: 'pm',       color: '#64748B' },
  { id: '07', name: 'Ethan Wright',  initials: 'EW', online: false, status: '5h ago',  role: 'data',     color: '#334155' },
];

/* ----------------------------- pieces ----------------------------- */
function RoleBadge({ role }) {
  const r = ROLES[role];
  return (
    <span className="sl-badge" data-tone={r.tone}>
      <span className="material-symbols-outlined">{r.icon}</span>
      <span className="sl-badge-lbl">{r.label}</span>
    </span>
  );
}

function MemberItem({ m, sweep, delay }) {
  return (
    <div className={'sl-item' + (sweep ? ' sl-sweep' : '')} style={sweep ? { animationDelay: delay + 'ms' } : undefined}>
      <div className="sl-ava-wrap">
        <div className="sl-ava" style={{ backgroundColor: m.color }}>{m.initials}</div>
        {m.online && <span className="sl-online" />}
      </div>
      <div className="sl-meta">
        <div className="sl-name">{m.name}</div>
        <div className={'sl-status ' + (m.online ? 'is-online' : 'is-off')}>
          {m.online && <span className="dot" />}
          <span>{m.status}</span>
        </div>
      </div>
      <RoleBadge role={m.role} />
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="sl-empty">
      <span className="material-symbols-outlined">person_search</span>
      No teammates match “{label}”.
    </div>
  );
}

/* ----------------------------- app ----------------------------- */
function StackedList({ startOpen, onlineOnly, mono }) {
  const [expanded, setExpanded] = useState(startOpen);
  const [activeQuery, setActiveQuery] = useState('');
  const [dirQuery, setDirQuery] = useState('');

  useEffect(() => { setExpanded(startOpen); }, [startOpen]);

  const matches = (m, q) => {
    q = q.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || ROLES[m.role].label.toLowerCase().includes(q);
  };

  const activeBase = useMemo(() => (onlineOnly ? MEMBERS.filter((m) => m.online) : MEMBERS), [onlineOnly]);
  const activeList = useMemo(() => activeBase.filter((m) => matches(m, activeQuery)), [activeBase, activeQuery]);
  const dirList = useMemo(() => MEMBERS.filter((m) => matches(m, dirQuery)), [dirQuery]);

  const stack = MEMBERS.slice(0, 3);
  const remaining = MEMBERS.length - stack.length;

  return (
    <div className={'sl-panel' + (mono ? ' is-mono' : '')}>

      {/* ---------- base view: active members ---------- */}
      <div className="sl-active">
        <div className="sl-active-head">
          <div className="sl-top">
            <div className="sl-title">
              {onlineOnly ? 'Active Members' : 'All Members'}
              <span className="sl-count">{activeBase.length}</span>
            </div>
            <button className="sl-add" aria-label="Add member">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <div className="sl-search">
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="Search teammates…"
              value={activeQuery}
              onChange={(e) => setActiveQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="sl-list">
          {activeList.length
            ? activeList.map((m) => (
                <MemberItem key={'a-' + m.id} m={m} />
              ))
            : <EmptyState label={activeQuery} />}
        </div>
      </div>

      {/* ---------- floating directory dock ---------- */}
      <div
        className={'sl-bar' + (expanded ? ' is-expanded' : '')}
        onClick={() => { if (!expanded) setExpanded(true); }}
      >
        <div className="sl-bar-head">
          <div className="sl-bar-left">
            <div className="sl-bar-icon">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <div className="sl-bar-titles">
              <h4>Member Directory</h4>
              <p>{MEMBERS.length} Members Registered</p>
            </div>
          </div>
          <div className="sl-bar-right">
            <div className="sl-stack">
              {stack.map((m) => (
                <div key={'s-' + m.id} className="sl-mini" style={{ backgroundColor: m.color }}>{m.initials}</div>
              ))}
              {remaining > 0 && <div className="sl-more">+{remaining}</div>}
            </div>
            <button
              className="sl-close"
              aria-label="Close directory"
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="sl-bar-body">
          <div className="sl-bar-search">
            <div className="sl-search sl-search--sm">
              <span className="material-symbols-outlined">search</span>
              <input
                placeholder="Search members…"
                value={dirQuery}
                onChange={(e) => setDirQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="sl-bar-list">
            {expanded && (dirList.length
              ? dirList.map((m, i) => (
                  <MemberItem key={'d-' + m.id} m={m} sweep delay={i * 45} />
                ))
              : <EmptyState label={dirQuery} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- mount + tweaks ----------------------------- */
function App() {
  const TW = /*EDITMODE-BEGIN*/{
    "open": false,
    "onlineOnly": true,
    "badges": "tinted",
    "dark": false
  } /*EDITMODE-END*/;
  const [t, setTweak] = useTweaks(TW);

  useEffect(() => {
    const th = t.dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', th);
    document.body.setAttribute('data-theme', th);
  }, [t.dark]);

  return (
    <div className="sl-shell">
      <StackedList startOpen={t.open} onlineOnly={t.onlineOnly} mono={t.badges === 'mono'} />

      <TweaksPanel>
        <TweakSection label="Directory" />
        <TweakToggle label="Open directory" value={t.open} onChange={(v) => setTweak('open', v)} />
        <TweakToggle label="Online only" value={t.onlineOnly} onChange={(v) => setTweak('onlineOnly', v)} />
        <TweakSection label="Style" />
        <TweakRadio label="Role badges" value={t.badges}
          options={['tinted', 'mono']}
          onChange={(v) => setTweak('badges', v)} />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak('dark', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
