(function () {
  function ColorsNeutrals() {
    return (
      <div className="card">
        <div className="cn-label-row">
          <div className="cn-lr-title"><span className="cn-lr-dot"></span>Neutrals — Slate</div>
          <div className="cn-lr-meta">fg / bg / borders</div>
        </div>
        <div className="swatches">
          <div className="sw lite" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>50<br />F8FAFC</div>
          <div className="sw lite" style={{ background: '#F1F5F9' }}>100<br />F1F5F9</div>
          <div className="sw lite" style={{ background: '#E2E8F0' }}>200<br />E2E8F0</div>
          <div className="sw lite" style={{ background: '#CBD5E1' }}>300<br />CBD5E1</div>
          <div className="sw lite" style={{ background: '#94A3B8' }}>400<br />94A3B8</div>
          <div className="sw dark" style={{ background: '#64748B' }}>500<br />64748B</div>
          <div className="sw dark" style={{ background: '#475569' }}>600<br />475569</div>
          <div className="sw dark" style={{ background: '#334155' }}>700<br />334155</div>
          <div className="sw dark" style={{ background: '#1E293B' }}>800<br />1E293B</div>
          <div className="sw dark" style={{ background: '#0F172A' }}>900<br />0F172A</div>
        </div>
      </div>
    );
  }
  window.ColorsNeutrals = ColorsNeutrals;
})();
