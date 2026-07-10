/**
 * LeadStatusBadge — shows a CRM lead's pipeline status as a compact colored
 * badge, with a single-action button to advance the status through the
 * pipeline (or reopen a closed lead).
 *
 * DEPLOYMENT TARGET: no-bundler preview harness (@babel/standalone, Node
 * pre-compiled TSX). React is available as a global.
 *
 * Rules applied:
 *  - oklch exclusively: semantic Tailwind tokens + oklch() for non-semantic hues
 *  - Zero useEffect; all state is event-driven (pointer handlers, derived state)
 *  - Explicit type="button" on every <button>
 *  - Semantic HTML: <article>, <header>, <ol>, <li>
 *  - size-* shorthand for all square elements
 *  - bg-primary used directly — never redefined locally
 *  - No import / export statements
 *  - Dark mode via html.dark class scope
 */

const { useState } = React;

// ---------------------------------------------------------------------------
// Pipeline definition
// ---------------------------------------------------------------------------

type Status = "New" | "Contacted" | "Qualified" | "Won" | "Lost";

const PIPELINE_STAGES: Status[] = ["New", "Contacted", "Qualified", "Won"];

interface StatusMeta {
  badgeCls?:    string;
  badgeStyle?:  React.CSSProperties;
  dotCls?:      string;
  dotStyle?:    React.CSSProperties;
  next:         Status;
  terminal:     boolean;
  advanceLabel: string;
}

const STATUS_META: Record<Status, StatusMeta> = {
  New: {
    badgeCls:     "bg-muted text-muted-foreground",
    dotCls:       "bg-muted-foreground",
    next:         "Contacted",
    terminal:     false,
    advanceLabel: "Mark as Contacted",
  },
  Contacted: {
    badgeCls:     "bg-primary/10 text-primary",
    dotCls:       "bg-primary",
    next:         "Qualified",
    terminal:     false,
    advanceLabel: "Mark as Qualified",
  },
  Qualified: {
    badgeStyle: {
      background: "oklch(0.78 0.13 80 / 0.18)",
      color:      "oklch(0.46 0.16 70)",
    },
    dotStyle:     { background: "oklch(0.64 0.17 74)" },
    next:         "Won",
    terminal:     false,
    advanceLabel: "Mark as Won",
  },
  Won: {
    badgeCls:     "bg-primary/20 text-primary",
    dotCls:       "bg-primary",
    next:         "New",
    terminal:     true,
    advanceLabel: "Reopen Lead",
  },
  Lost: {
    badgeCls:     "bg-destructive/15 text-destructive",
    dotCls:       "bg-destructive",
    next:         "New",
    terminal:     true,
    advanceLabel: "Reopen Lead",
  },
};

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return meta.dotCls
    ? <span className={`size-2 rounded-full flex-shrink-0 ${meta.dotCls}`} aria-hidden="true" />
    : <span className="size-2 rounded-full flex-shrink-0" style={meta.dotStyle} aria-hidden="true" />;
}

function StatusBadge({ status, large = false }: { status: Status; large?: boolean }) {
  const meta  = STATUS_META[status];
  const sizeCls = large
    ? "px-3 py-1 text-sm gap-2"
    : "px-2.5 py-0.5 text-xs gap-1.5";
  const base = `inline-flex items-center rounded-full font-medium ${sizeCls}`;
  return meta.badgeCls
    ? (
      <span className={`${base} ${meta.badgeCls}`}>
        <StatusDot status={status} />
        {status}
      </span>
    )
    : (
      <span className={base} style={meta.badgeStyle}>
        <StatusDot status={status} />
        {status}
      </span>
    );
}

// ---------------------------------------------------------------------------
// Pipeline progress strip
// ---------------------------------------------------------------------------

function PipelineStrip({ current }: { current: Status }) {
  const activeIdx = PIPELINE_STAGES.indexOf(current);
  const isLost    = current === "Lost";

  return (
    <ol
      className="flex items-center gap-0"
      aria-label="Pipeline stages"
    >
      {PIPELINE_STAGES.map((stage, i) => {
        const done    = !isLost && i < activeIdx;
        const active  = !isLost && stage === current;
        const last    = i === PIPELINE_STAGES.length - 1;

        return (
          <li key={stage} className="flex items-center">
            {/* node */}
            <span
              title={stage}
              className={[
                "rounded-full transition-all duration-200",
                active  ? "size-3 bg-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-card" : "",
                done    ? "size-2 bg-primary/50"                                                      : "",
                !active && !done ? "size-2 bg-border"                                                 : "",
              ].filter(Boolean).join(" ")}
            />
            {/* connector */}
            {!last && (
              <span
                className={`h-px w-6 transition-colors duration-200 ${done ? "bg-primary/40" : "bg-border"}`}
              />
            )}
          </li>
        );
      })}

      {/* Lost marker — separate, to the right */}
      <li className="flex items-center ml-3" title="Lost">
        <span
          className={[
            "rounded-full transition-all duration-200",
            isLost  ? "size-3 bg-destructive ring-2 ring-destructive/30 ring-offset-1 ring-offset-card"
                    : "size-2 bg-border",
          ].join(" ")}
        />
      </li>
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Advance button (press-to-scale tactile feedback)
// ---------------------------------------------------------------------------

function ActionButton({
  label,
  variant,
  onClick,
}: {
  label:    string;
  variant:  "primary" | "muted" | "destructive-outline";
  onClick:  () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const variantCls = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    muted:   "bg-muted text-foreground hover:bg-accent",
    "destructive-outline":
      "border border-border text-destructive hover:bg-destructive/10",
  }[variant];

  return (
    <button
      type="button"
      className={[
        "w-full rounded-xl px-4 py-2.5 text-sm font-semibold",
        "transition-[transform,opacity] duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variantCls,
        pressed ? "scale-[0.97]" : "",
      ].join(" ")}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick(); }}
      onPointerLeave={() => setPressed(false)}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function LeadStatusCard({
  leadName,
  contact,
  tier,
  initialStatus = "New",
}: {
  leadName:      string;
  contact:       string;
  tier:          string;
  initialStatus?: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const meta = STATUS_META[status];

  return (
    <article
      className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden w-full max-w-sm"
      aria-label={`Lead status card for ${leadName}`}
    >
      {/* Lead header */}
      <header className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Lead
          </p>
          <h2 className="text-sm font-semibold text-foreground truncate">
            {leadName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {contact} · <span className="font-medium">{tier}</span>
          </p>
        </div>

        {/* Current status badge — prominent */}
        <div className="flex-shrink-0 pt-0.5">
          <StatusBadge status={status} large />
        </div>
      </header>

      {/* Pipeline strip */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Pipeline</span>
        <PipelineStrip current={status} />
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex flex-col gap-2">
        <ActionButton
          label={meta.advanceLabel}
          variant={meta.terminal ? "muted" : "primary"}
          onClick={() => setStatus(meta.next)}
        />

        {/* Secondary: mark lost — only while actively progressing */}
        {!meta.terminal && (
          <ActionButton
            label="Mark as Lost"
            variant="destructive-outline"
            onClick={() => setStatus("Lost")}
          />
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// All-status reference strip
// ---------------------------------------------------------------------------

function AllStatusesRow() {
  const all: Status[] = ["New", "Contacted", "Qualified", "Won", "Lost"];
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-2" aria-label="All statuses reference">
      {all.map(s => <StatusBadge key={s} status={s} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root — single top-level export-free component
// ---------------------------------------------------------------------------

function LeadStatusBadge() {
  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-display"
      style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
    >
      {/* Google Fonts — Montserrat */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap"
      />

      <LeadStatusCard
        leadName="Acme Corporation"
        contact="Sarah Chen"
        tier="Enterprise"
        initialStatus="New"
      />

      <AllStatusesRow />

      <p className="mt-4 text-xs text-muted-foreground text-center">
        All statuses shown above for reference
      </p>
    </div>
  );
}
