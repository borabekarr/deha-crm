/* Canonical-pass fixture for token-fidelity-gate.
   Every color literal below is a manifest token expressed as oklch (or a
   pure-white overlay), so the gate must exit 0 on this file. Standalone:
   no import/export, registers on window, no useEffect. */

function CanonicalPassPanel() {
  const shell = {
    // slate-100 bg  (--slate-100: L 0.968 C 0.007 H 247.9)
    background: 'oklch(0.968 0.007 247.9)',
    // slate-900 text  (--slate-900: L 0.208 C 0.04 H 265.8)
    color: 'oklch(0.208 0.04 265.8)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
  };

  const accent = {
    // brand primary  (--brand-primary: L 0.696 C 0.149 H 162.5)
    background: 'oklch(0.696 0.149 162.5)',
    // white on the accent chip
    color: 'oklch(1 0 0)',
    borderRadius: 'var(--radius-pill)',
    padding: 'var(--space-2)',
  };

  return (
    <div style={shell}>
      <h3 style={{ color: 'oklch(0.208 0.04 265.8)' }}>Canonical Pass</h3>
      <span className="cpf-accent" style={accent}>
        On palette
      </span>
    </div>
  );
}

(window as unknown as { CanonicalPassFixture: unknown }).CanonicalPassFixture =
  CanonicalPassPanel;
