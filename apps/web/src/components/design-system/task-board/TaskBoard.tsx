import React from 'react';
import '../../../../design-system/preview/_base.css';
import '../../../../design-system/preview/_darkmode.css';
import './TaskBoard.css';
import { iconClass } from '@/lib/iconClass';
import { useAutoHeight } from '@/lib/hooks/use-auto-height';
import { useSquircle } from '@/lib/hooks/use-squircle';
import { useProximityGroup } from '@/lib/hooks';
import { makeTaskBoardTimers, type SyncPhase, type TaskBoardTimers } from './task-board-hook';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Task {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2';
  col: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COLUMNS = [
  { id: 'todo',     label: 'Todo' },
  { id: 'progress', label: 'In Progress' },
  { id: 'review',   label: 'Review' },
  { id: 'done',     label: 'Done' },
];

const PRIORITY: Record<string, { color: string; bg: string; label: string; rank: number }> = {
  P0: { color: '#EF4444', bg: '#FEF2F2', label: 'P0', rank: 0 },
  P1: { color: '#F97316', bg: '#FFF7ED', label: 'P1', rank: 1 },
  P2: { color: '#3B82F6', bg: '#EFF6FF', label: 'P2', rank: 2 },
};

const INITIAL_TASKS: Task[] = [
  { id: 't1',  title: 'Investigate billing webhook timeout',        priority: 'P0', col: 'todo' },
  { id: 't2',  title: 'Add empty states for analytics dashboard',   priority: 'P1', col: 'todo' },
  { id: 't3',  title: 'Update API rate limits in docs',             priority: 'P2', col: 'todo' },
  { id: 't4',  title: 'Onboarding flow polish pass',                priority: 'P1', col: 'todo' },
  { id: 't5',  title: 'Implement OAuth flow for Slack integration',  priority: 'P1', col: 'progress' },
  { id: 't6',  title: 'Refactor settings provider',                 priority: 'P2', col: 'progress' },
  { id: 't7',  title: 'Migrate to Next.js 16 app router',           priority: 'P1', col: 'progress' },
  { id: 't8',  title: 'Fix dark mode flicker on initial load',      priority: 'P0', col: 'review' },
  { id: 't9',  title: 'Audit a11y on settings page',                priority: 'P1', col: 'review' },
  { id: 't10', title: 'Ship release notes for v0.42',               priority: 'P1', col: 'done' },
  { id: 't11', title: 'Document API rate limits',                   priority: 'P2', col: 'done' },
  { id: 't12', title: 'Triage inbound bug reports',                 priority: 'P0', col: 'done' },
];

const MOVE_CONFIG: Record<string, { bg: string; icon: string; label: string }> = {
  'success-done':     { bg: 'var(--brand-primary-500)', icon: 'task_alt',   label: 'Done' },
  'success-progress': { bg: '#F97316', icon: 'bolt',       label: 'In Progress' },
  'success-review':   { bg: '#FBBF24', icon: 'visibility', label: 'Review' },
};

// Phase-specific config for the single morphing sync button
const SYNC_BTN_PHASE: Record<string, { bg: string; color: string; icon: string; label: string; spin: boolean }> = {
  idle:       { bg: 'var(--tb-syncbtn)', color: '#fff',    icon: 'autorenew', label: 'Sync with Agent', spin: false },
  connecting: { bg: '#6B6B6B',           color: '#fff',    icon: 'sync',      label: 'Connecting…',     spin: true  },
  slack:      { bg: '#F97316',           color: '#fff',    icon: 'autorenew', label: 'Reading Slack…',  spin: true  },
  github:     { bg: '#FBBF24',           color: '#451A03', icon: 'autorenew', label: 'Reading GitHub…', spin: true  },
  notion:     { bg: 'var(--brand-primary-500)',           color: '#fff',    icon: 'autorenew', label: 'Reading Notion…', spin: true  },
  done:       { bg: 'var(--brand-primary-500)',           color: '#fff',    icon: 'task_alt',  label: 'Synced!',         spin: false },
};

const COL_TAG: Record<string, { bg: string; fg: string; icon: string; label: string }> = {
  todo:     { bg: '#6B6B6B', fg: '#FFFFFF', icon: 'inbox',      label: 'Todo' },
  progress: { bg: '#F97316', fg: '#FFFFFF', icon: 'bolt',       label: 'In Progress' },
  review:   { bg: '#FACC15', fg: '#451A03', icon: 'visibility', label: 'Review' },
  done:     { bg: 'var(--brand-primary-500)', fg: '#FFFFFF', icon: 'task_alt',   label: 'Done' },
};

// ---------------------------------------------------------------------------
// Source brand marks (abstract / monogram — not trademarked logos)
// ---------------------------------------------------------------------------
const SlackMark = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
    <rect x="2"    y="6.5"  width="3.5" height="3.5" rx="1.6" fill="#6F4DDB" />
    <rect x="6.5"  y="2"    width="3.5" height="3.5" rx="1.6" fill="#7A5BE6" />
    <rect x="10.5" y="6.5"  width="3.5" height="3.5" rx="1.6" fill="#5A3DBE" />
    <rect x="6.5"  y="10.5" width="3.5" height="3.5" rx="1.6" fill="#8568EE" />
  </svg>
);

const GithubMark = ({ size = 14, color = '#111111' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
    <path fill={color} d="M8 1.2a6.8 6.8 0 0 0-2.15 13.25c.34.06.46-.15.46-.32v-1.13c-1.9.41-2.3-.91-2.3-.91-.31-.79-.76-1-.76-1-.62-.42.05-.41.05-.41.69.05 1.05.71 1.05.71.61 1.05 1.6.75 1.99.57.06-.45.24-.75.43-.92-1.52-.17-3.11-.76-3.11-3.39 0-.75.27-1.36.7-1.84-.07-.17-.31-.87.07-1.81 0 0 .58-.19 1.9.7a6.6 6.6 0 0 1 3.46 0c1.32-.89 1.9-.7 1.9-.7.38.94.14 1.64.07 1.81.44.48.7 1.09.7 1.84 0 2.64-1.6 3.21-3.12 3.38.25.21.47.63.47 1.27v1.88c0 .18.12.39.46.32A6.8 6.8 0 0 0 8 1.2z" />
  </svg>
);

const NotionMark = ({ size = 14, color = '#111111' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
    <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" fill="none" stroke={color} strokeWidth="1" />
    <path fill={color} d="M5 4.4 L5 11.6 L6.05 11.6 L6.05 6.55 L9.4 11.6 L11 11.6 L11 4.4 L9.95 4.4 L9.95 9.45 L6.6 4.4 Z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Small icon helpers
// ---------------------------------------------------------------------------
const SymIcon = ({ name, size = 16, style = {} }: { name: string; size?: number; style?: React.CSSProperties }) => (
  <span
    className={iconClass(name)}
    style={{ fontSize: size, lineHeight: 1, fontVariationSettings: '"opsz" 24, "wght" 500', ...style }}
  >
    {name}
  </span>
);

const CheckIcon = ({ size = 11, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2.5 6.2 L5 8.5 L9.5 3.5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Confetti burst (flows INSIDE the card; clipped to its box)
// ---------------------------------------------------------------------------
const CONFETTI_COLORS = ['var(--brand-primary-500)', 'var(--brand-primary-400)', 'var(--brand-primary-300)', 'var(--brand-primary-200)', '#FBBF24', '#FCD34D'];

// Particles computed once at module level so Math.random() never runs during render.
const CONFETTI_PARTICLES = (() => {
  const items = [];
  const count = 34;
  for (let i = 0; i < count; i++) {
    const startX   = 8  + Math.random() * 84;
    const startY   = -6 + Math.random() * 28;
    const dx       = (Math.random() - 0.5) * 70;
    const dy       = 60  + Math.random() * 70;
    const rot      = (Math.random() - 0.5) * 720;
    const size     = 4   + Math.random() * 3;
    const shape    = i % 3;
    items.push({
      id: i,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left:     `${startX}%`,
      top:      `${startY}%`,
      dx:       `${dx}px`,
      dy:       `${dy}px`,
      rot:      `${rot}deg`,
      size,
      shape,
      delay:    Math.random() * 320,
      duration: 1400 + Math.random() * 700,
    });
  }
  return items;
})();

function Confetti() {
  const particles = CONFETTI_PARTICLES;

  return (
    <div aria-hidden="true" className="tb-confetti-layer">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: p.top, left: p.left,
            width: p.size,
            height: p.shape === 1 ? p.size * 2.1 : p.size,
            borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? '1px' : '2px',
            background: p.color,
            ['--dx' as string]: p.dx,
            ['--dy' as string]: p.dy,
            ['--rot' as string]: p.rot,
            animation: `confettiFlow calc(${p.duration}ms * var(--anim-mult, 1)) var(--ease-confetti) calc(${p.delay}ms * var(--anim-mult, 1)) forwards`,
            boxShadow: '0 1px 2px rgba(17,17,17,0.10)',
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Move-result badge
// ---------------------------------------------------------------------------
function MoveBadge({ kind }: { kind: string }) {
  const cfg = MOVE_CONFIG[kind];
  if (!cfg) return null;
  return (
    <div
      className="move-badge"
      style={{
        background: cfg.bg,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)',
        backgroundSize: '7px 7px',
      }}
    >
      <span className={`${iconClass(cfg.icon)} move-badge-icon`}>{cfg.icon}</span>
      {cfg.label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
interface ToastData { message: string; kind: string }

function Toast({
  message,
  kind,
  phase,
  onUndo,
  onClose,
}: {
  message: string;
  kind: string;
  phase: string;
  onUndo: (() => void) | null;
  onClose: () => void;
}) {
  const cfg = MOVE_CONFIG[kind] ?? { bg: '#6B6B6B', icon: 'info', label: '' };
  const toastRef = useProximityGroup<HTMLDivElement>();
  return (
    <div
      ref={toastRef}
      className={`tb-toast ${phase === 'out' ? 'tb-toast-out' : 'tb-toast-in'}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '9px 10px 9px 12px',
        borderRadius: 14,
        background: cfg.bg,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)',
        backgroundSize: '7px 7px',
        color: '#fff',
        fontSize: 12.5, fontWeight: 700,
        letterSpacing: '-0.005em',
        boxShadow: '0 8px 24px -6px rgba(17,17,17,0.35), inset 0 1px 0 rgba(255,255,255,0.20)',
        maxWidth: 360,
        whiteSpace: 'nowrap',
      }}
    >
      <SymIcon name="check_circle" size={15} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{message}</span>
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          data-proximity
          style={{
            padding: '3px 9px', borderRadius: 8,
            background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.30)',
            color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Undo
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        data-proximity
        style={{
          width: 22, height: 22, padding: 0, flexShrink: 0,
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 8, color: 'rgba(255,255,255,0.85)',
          cursor: 'pointer', display: 'grid', placeItems: 'center',
        }}
      >
        <SymIcon name="close" size={13} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column header tag
// ---------------------------------------------------------------------------
function ColumnTag({ colId, count }: { colId: string; count: number }) {
  const t = COL_TAG[colId];
  const isDarkText = t.fg !== '#FFFFFF';
  return (
    <span
      className="tb-stat-badge"
      style={{ background: t.bg, color: t.fg }}
    >
      <span
        className={`${iconClass(t.icon)} tb-stat-badge-icon`}
        aria-hidden="true"
        style={{ color: t.fg, textShadow: isDarkText ? 'none' : undefined }}
      >
        {t.icon}
      </span>
      {t.label}
      <span className="tb-stat-badge-count">{count}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Task card
// ---------------------------------------------------------------------------
function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  dragging,
  highlight,
  successClass,
}: {
  task: Task;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  dragging: boolean;
  highlight: boolean;
  successClass: string | null;
}) {
  const p = PRIORITY[task.priority];
  const showConfetti = successClass === 'success-done';

  return (
    <div
      data-flip-id={task.id}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      data-proximity
      className={`tb-card ${dragging ? 'dragging' : ''} ${successClass ?? ''}`}
      style={{
        position: 'relative',
        background: highlight ? 'var(--tb-card-hl)' : 'var(--tb-card-bg)',
        border: `1px ${highlight ? 'dashed' : 'solid'} ${highlight ? 'var(--brand-primary-500)' : 'var(--tb-card-border)'}`,
        borderRadius: 10,
        padding: '10px 11px 10px',
        cursor: 'grab',
        userSelect: 'none',
        overflow: 'visible',
      }}
    >
      {showConfetti && <Confetti />}
      {successClass && <MoveBadge kind={successClass} />}

      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.32, color: 'var(--tb-fg1)', marginBottom: 10, textWrap: 'pretty' } as React.CSSProperties}>
        {task.title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 7px 2px 5px',
          borderRadius: 9999,
          background: p.bg,
          border: `1px solid ${p.color}22`,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: p.color, display: 'inline-block',
            boxShadow: `0 0 0 3px ${p.bg}`,
          }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: p.color, letterSpacing: '0.02em' }}>
            {p.label}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <SymIcon
          name="drag_indicator"
          size={13}
          style={{ color: 'var(--tb-fg4)', opacity: 0.6 }}
        />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--tb-fg4)', letterSpacing: '-0.005em' }}>
          Drag to reschedule
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------
function Column({
  col,
  tasks,
  onDragStart,
  onDragEnd,
  onDrop,
  draggingId,
  highlightIds,
  recentMoveId,
}: {
  col: { id: string; label: string };
  tasks: Task[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDrop: (colId: string) => void;
  draggingId: string | null;
  highlightIds: Set<string>;
  recentMoveId: string | null;
}) {
  const [over, setOver] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(false);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const cardsProxRef = useProximityGroup<HTMLDivElement>();

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const overflowing = el.scrollHeight > el.clientHeight + 2;
    setCanScrollDown(overflowing && el.scrollTop < el.scrollHeight - el.clientHeight - 4);
    setCanScrollUp(overflowing && el.scrollTop > 4);
  };

  // successClass derived from recentMoveId — no timing side-effect needed
  const successClass = (taskId: string): string | null => {
    if (recentMoveId !== taskId) return null;
    const kindMap: Record<string, string> = { done: 'success-done', progress: 'success-progress', review: 'success-review' };
    return kindMap[col.id] ?? null;
  };

  return (
    <div
      data-col={col.id}
      className={`tb-column ${over ? 'drop-target' : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const dragId = draggingId;   // capture before onDrop clears draggingId
        onDrop(col.id);
        // After React commits the new card into this column's DOM, scroll it fully
        // into view so it's never hidden under the progressive bottom blur.
        // Double-rAF waits for React's commit + paint before reading layout.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const el = scrollRef.current;
          if (!el || !dragId) return;
          const card = el.querySelector(`[data-flip-id="${dragId}"]`);
          if (!card) return;
          const blurClearance = 60;   // bottom blur height (52px) + margin
          const cardRect = card.getBoundingClientRect();
          const elRect   = el.getBoundingClientRect();
          const cardBottom = cardRect.bottom - elRect.top;
          if (cardBottom > el.clientHeight - blurClearance) {
            el.scrollBy({ top: cardBottom - (el.clientHeight - blurClearance) + 4, behavior: 'smooth' });
          }
        }));
      }}
      style={{
        background: 'var(--tb-col-bg)',
        border: '1px solid var(--tb-col-border)',
        borderRadius: 12,
        padding: 10,
        display: 'flex', flexDirection: 'column', gap: 14,
        height: 380,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'background 160ms, outline-color 160ms',
      }}
    >
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px 0', flexShrink: 0 }}>
        <ColumnTag colId={col.id} count={tasks.length} />
      </div>

      {/* Scrollable task list */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div
          ref={(el) => {
            scrollRef.current = el;
            cardsProxRef(el);
            if (el) checkScroll();
          }}
          onScroll={checkScroll}
          className="tb-column-scroll"
          style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            overflowY: 'auto',
            height: '100%',
            boxSizing: 'border-box',
            padding: '4px 4px 4px 2px',
          }}
        >
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              dragging={draggingId === t.id}
              highlight={highlightIds.has(t.id)}
              successClass={successClass(t.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>

        {/* Scroll-fade at top */}
        {canScrollUp && (
          <div
            aria-hidden="true"
            className="tb-fade tb-fade-top"
            style={{
              position: 'absolute',
              top: 0, left: 2, right: 6,
              height: 44,
              background: 'linear-gradient(to top, var(--tb-fade1) 0%, var(--tb-fade2) 58%, var(--tb-fade3) 100%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}

        {/* Scroll-fade at bottom */}
        {canScrollDown && (
          <div
            aria-hidden="true"
            className="tb-fade tb-fade-bot"
            style={{
              position: 'absolute',
              bottom: 0, left: 2, right: 6,
              height: 52,
              background: 'linear-gradient(to bottom, var(--tb-fade1) 0%, var(--tb-fade2) 60%, var(--tb-fade3) 100%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const headerTitleStyle: React.CSSProperties = {
  margin: 0, display: 'inline-flex', alignItems: 'center', gap: 7,
  fontSize: 19, fontWeight: 800, color: 'var(--tb-fg1)',
  letterSpacing: '-0.025em', fontFamily: "'Montserrat', sans-serif",
};

function Header({ total }: { total: number }) {
  return (
    // Flat flex row — inner container div removed (feedback #6)
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px 14px' }}>
      <h1 style={headerTitleStyle}>
        {/* leading view_kanban glyph (item 5) */}
        <span className={iconClass('view_kanban')} aria-hidden style={{ fontSize: 20, lineHeight: 1, fontVariationSettings: '"opsz" 24, "wght" 500' }}>view_kanban</span>
        Task Board
      </h1>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 10px 2px 7px',
        borderRadius: 9999,
        background: 'var(--tb-chip-bg)',
        border: '1px solid var(--tb-col-border)',
        fontSize: 12, fontWeight: 700, color: 'var(--tb-chip-fg)',
        letterSpacing: '-0.01em',
      }}>
        <span className={iconClass('assignment')} style={{ fontSize: 13 }}>assignment</span>
        {total} tasks
      </span>
      {/* AI Sync pushed to right with marginLeft: auto */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <SymIcon name="neurology" size={18} style={{ color: 'var(--brand-primary-500)' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tb-fg3)', letterSpacing: '-0.01em' }}>
          AI Sync
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source pill (Slack/GitHub/Notion mini-avatar)
// ---------------------------------------------------------------------------
function SourcePill({ source, state }: { source: string; state: string }) {
  if (state === 'done') {
    return (
      <div className="tb-check-pop" style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--brand-primary-500)', display: 'grid', placeItems: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.12)',
      }}>
        <CheckIcon size={11} color="#fff" />
      </div>
    );
  }
  const Mark = source === 'slack' ? SlackMark : source === 'github' ? GithubMark : NotionMark;
  const ringColor = source === 'slack' ? '#6F4DDB' : '#111111';
  const ring =
    state === 'active'
      ? { background: source === 'slack' ? '#F4F0FF' : '#F5F5F5', boxShadow: `0 0 0 1.5px ${ringColor}, inset 0 1px 0 rgba(255,255,255,0.5)` }
      : { background: '#FAFAFA', boxShadow: 'inset 0 0 0 1px #ECECEC' };

  return (
    <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', ...ring }}>
      <Mark size={12} color={source === 'github' ? (state === 'active' ? '#111111' : '#A1A1A1') : undefined} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Update feed item
// ---------------------------------------------------------------------------
const UPDATE_ITEM_TAG_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700,
  color: 'var(--brand-primary-500)', flexShrink: 0, marginTop: 2,
};

interface FeedItem {
  id: string;
  source: string;
  context?: string;
  body: string;
  tag?: string;
  _delay?: number;
}

function UpdateItem({ item }: { item: FeedItem }) {
  const palette = ({
    slack:  { dot: '#6F4DDB', label: 'Slack',  prefix: '·' },
    github: { dot: '#111111', label: 'GitHub', prefix: '·' },
    notion: { dot: '#4A4A4A', label: 'Notion', prefix: '·' },
    agent:  { dot: 'var(--brand-primary-500)', label: 'Agent',  prefix: '' },
  } as Record<string, { dot: string; label: string; prefix: string }>)[item.source] ?? { dot: '#4A4A4A', label: item.source, prefix: '·' };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '11px 16px',
      borderBottom: '1px dashed var(--tb-col-border)',
      animation: `itemBounce calc(380ms * var(--anim-mult, 1)) var(--ease-bounce) both`,
    }}>
      <span style={{
        marginTop: 6, width: 7, height: 7, borderRadius: '50%',
        background: palette.dot, flexShrink: 0,
        boxShadow: `0 0 0 3px ${palette.dot}1A`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tb-fg1)', letterSpacing: '-0.005em' }}>
          <span style={{ color: palette.dot }}>{palette.label}</span>
          {item.context && (
            <span style={{ color: 'var(--tb-fg4)', fontWeight: 600 }}> {palette.prefix} {item.context}</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--tb-fg3)', marginTop: 2, letterSpacing: '-0.002em', textWrap: 'pretty' } as React.CSSProperties}>
          {item.body}
        </div>
      </div>
      {item.tag && (
        <div style={UPDATE_ITEM_TAG_STYLE}>
          <CheckIcon size={11} color="var(--brand-primary-500)" />
          {item.tag}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sync feed (stays mounted; toggled via CSS visibility/opacity)
// ---------------------------------------------------------------------------
function SyncFeed({ items, visible }: { items: FeedItem[]; visible: boolean }) {
  // Outer div toggles opacity+visibility (CSS class); the ref goes on the
  // inner content div, whose measured height useAutoHeight animates.
  const { ref } = useAutoHeight<HTMLDivElement>({
    open: visible,
    duration: 340,
    easing: 'cubic-bezier(.22,1,.36,1)',
  });
  return (
    <div className={`tb-sync-feed ${visible ? 'tb-sync-feed--visible' : ''}`}>
      <div ref={ref} style={{
        borderTop: '1px solid var(--tb-col-border)',
        background: 'var(--tb-feed-bg)',
        animation: 'panelIn 360ms var(--ease-out)',
      }}>
        {items.map((it) => (
          <UpdateItem key={it.id} item={it} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status bar
// ---------------------------------------------------------------------------
function StatusBar({
  sourceStates,
  statusText,
  phase,
  onSync,
  syncedCount,
  syncBtnAnim: _syncBtnAnim,   // kept for API compat; morph uses key={phase} instead
}: {
  sourceStates: { slack: string; github: string; notion: string };
  statusText: string;
  phase: SyncPhase;
  onSync: () => void;
  syncedCount: number;
  syncBtnAnim: string | null;
}) {
  const isDone = phase === 'done';
  const isClickable = phase === 'idle' || phase === 'done';
  const statusBarRef = useProximityGroup<HTMLDivElement>();

  // Morphing button config — color/text/icon morph on each phase change
  const btnCfg = SYNC_BTN_PHASE[phase] ?? SYNC_BTN_PHASE.idle;

  return (
    <div ref={statusBarRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 12px', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        {isDone ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--brand-primary-500)', display: 'grid', placeItems: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.12)',
                  animation: `checkPop calc(360ms * var(--anim-mult, 1)) var(--ease-bounce-soft) calc(${i * 90}ms * var(--anim-mult, 1)) both`,
                }}
              >
                <CheckIcon size={11} color="#fff" />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <SourcePill source="slack"  state={sourceStates.slack} />
            <SourcePill source="github" state={sourceStates.github} />
            <SourcePill source="notion" state={sourceStates.notion} />
          </div>
        )}
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: isDone ? 'var(--brand-primary-500)' : 'var(--tb-fg2)',
          letterSpacing: '-0.005em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isDone ? `Synced ${syncedCount} task${syncedCount === 1 ? '' : 's'}` : statusText}
        </span>
      </div>

      {/* Single morphing button — key={phase} remounts on each phase change,
          replaying the syncMorphBounce animation for the spring entrance.
          Color/text/icon morph from SYNC_BTN_PHASE config. */}
      <button
        key={phase}
        type="button"
        onClick={isClickable ? onSync : undefined}
        disabled={!isClickable}
        data-proximity
        className="sync-btn"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', borderRadius: 999,
          background: btnCfg.bg, color: btnCfg.color,
          border: 'none',
          fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.005em',
          cursor: isClickable ? 'pointer' : 'not-allowed',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 0 rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.12), 0 6px 16px -6px rgba(17,17,17,0.45)',
        }}
        onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
        onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
      >
        <span
          className={iconClass(btnCfg.icon)}
          style={{
            fontSize: 16, lineHeight: 1,
            animation: btnCfg.spin ? 'spin 800ms linear infinite' : 'none',
          }}
        >{btnCfg.icon}</span>
        {btnCfg.label}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sync sequence definition
// ---------------------------------------------------------------------------
function buildSequence(args: {
  setPhase: (p: SyncPhase) => void;
  setStatus: (s: string) => void;
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  setSourceStates: (s: { slack: string; github: string; notion: string }) => void;
  moveTask: (id: string, col: string) => void;
  highlight: (id: string) => void;
  clearHighlight: (id: string) => void;
}) {
  const { setPhase, setStatus, setFeed, setSourceStates, moveTask, highlight, clearHighlight } = args;
  return [
    { delay: 0, fn: () => { setPhase('connecting'); setStatus('Connecting to your workspace…'); setFeed([]); setSourceStates({ slack: 'idle', github: 'idle', notion: 'idle' }); } },

    // Slack phase
    { delay: 850, fn: () => { setPhase('slack'); setSourceStates({ slack: 'active', github: 'idle', notion: 'idle' }); setStatus('Scanning Slack conversations…'); setFeed([{ id: 'sl1', source: 'slack', context: '@maria in #eng-billing', body: "added the monitoring alert too, we'll catch it if it regresses", _delay: 0 }]); } },
    { delay: 700, fn: () => { setFeed((prev) => [...prev, { id: 'sl2', source: 'slack', context: '@kai in #eng-platform', body: 'scoped out the rate limit doc edits, waiting on review', _delay: 0 }]); } },
    { delay: 750, fn: () => { highlight('t1'); moveTask('t1', 'progress'); } },
    { delay: 850, fn: () => { clearHighlight('t1'); } },

    // GitHub phase
    { delay: 350, fn: () => { setPhase('github'); setSourceStates({ slack: 'done', github: 'active', notion: 'idle' }); setStatus('Reading GitHub issues and PRs…'); setFeed([{ id: 'gh1', source: 'github', context: 'PR #531 · ready', body: 'Implement OAuth flow for Slack integration', tag: 'Review', _delay: 0 }]); } },
    { delay: 700, fn: () => { highlight('t5'); moveTask('t5', 'review'); } },
    { delay: 600, fn: () => { setFeed((prev) => [...prev, { id: 'gh2', source: 'github', context: 'PR #482 · merged', body: 'Fix dark mode flicker on initial load', tag: 'Done', _delay: 0 }]); clearHighlight('t5'); } },
    { delay: 700, fn: () => { highlight('t8'); moveTask('t8', 'done'); } },
    { delay: 700, fn: () => { clearHighlight('t8'); } },

    // Notion phase
    { delay: 300, fn: () => { setPhase('notion'); setSourceStates({ slack: 'done', github: 'done', notion: 'active' }); setStatus('Skimming latest Notion updates…'); setFeed((prev) => [...prev, { id: 'no1', source: 'notion', context: 'Sprint Planning', body: 'Onboarding flow polish pass — moved to review per latest feedback round', _delay: 0 }]); } },
    { delay: 800, fn: () => { highlight('t4'); moveTask('t4', 'review'); } },
    { delay: 700, fn: () => { clearHighlight('t4'); setFeed((prev) => [...prev, { id: 'no2', source: 'notion', context: 'Design Review', body: 'Empty states spec finalized — ready to implement', _delay: 0 }]); } },
    { delay: 750, fn: () => { highlight('t2'); moveTask('t2', 'progress'); } },
    { delay: 700, fn: () => { clearHighlight('t2'); } },

    // Done
    { delay: 500, fn: () => { setPhase('done'); setSourceStates({ slack: 'done', github: 'done', notion: 'done' }); setStatus('Sync complete'); setFeed((prev) => [...prev, { id: 'ag1', source: 'agent', body: '4 tasks updated across Slack, GitHub, and Notion.', _delay: 0 }]); } },
  ];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TaskBoard() {
  const [tasks, setTasks]               = React.useState<Task[]>(INITIAL_TASKS);
  const [phase, setPhase]               = React.useState<SyncPhase>('idle');
  const [statusText, setStatus]         = React.useState('Ready to sync');
  const [feed, setFeed]                 = React.useState<FeedItem[]>([]);
  const [sourceStates, setSourceStates] = React.useState({ slack: 'idle', github: 'idle', notion: 'idle' });
  const [draggingId, setDraggingId]     = React.useState<string | null>(null);
  const [highlight, setHighlight]       = React.useState(new Set<string>());
  const [recentMoveId, setRecentMoveId] = React.useState<string | null>(null);
  const [toast, setToast]               = React.useState<ToastData | null>(null);
  const [toastPhase, setToastPhase]     = React.useState<'in' | 'out'>('in');
  const [syncBtnAnim, setSyncBtnAnim]   = React.useState<string | null>(null);
  // hasUndo tracks whether undoRef holds a value — avoids reading .current during render
  const [hasUndo, setHasUndo]           = React.useState(false);

  // Refs for mutable state that timers need to read without stale closures
  const undoRef            = React.useRef<{ id: string; from: string; fromIdx: number } | null>(null);
  const recentMoveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const taskHistoryRef     = React.useRef<Record<string, Record<string, number>>>({});
  // Hook timers ref — populated by callback-ref when the host element mounts
  const timersApiRef       = React.useRef<TaskBoardTimers | null>(null);

  // closeToast uses the timers API through the ref so it doesn't go stale
  const closeToast = React.useCallback(() => {
    timersApiRef.current?.cancelToastDismiss();
    undoRef.current = null;
    setHasUndo(false);
    setToastPhase('out');
    const t = setTimeout(() => {
      setToast(null);
      setToastPhase('in');
    }, 240);
    // Register this cleanup timer too so teardown can clear it
    timersApiRef.current?.registerSyncTimer(t);
  }, []);

  const COL_RANK: Record<string, number> = { todo: 0, progress: 1, review: 2, done: 3 };

  // FLIP helpers — capture card positions before a reorder, animate after the commit.
  const moveTasks = React.useCallback((updater: (curr: Task[]) => Task[]) => {
    timersApiRef.current?.captureFlip();
    setTasks(updater);
    timersApiRef.current?.scheduleFlip();
  }, []);

  // ---- Manual drag/drop ----
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragEnd = () => setDraggingId(null);

  const onDrop = (colId: string) => {
    if (!draggingId) return;
    const task = tasks.find((t) => t.id === draggingId);
    if (!task) { setDraggingId(null); return; }
    const fromCol = task.col;
    if (fromCol === colId) { setDraggingId(null); return; }

    const isForward = (COL_RANK[colId] ?? 0) > (COL_RANK[fromCol] ?? 0);
    const fromColTasks = tasks.filter((t) => t.col === fromCol);
    const oldIdxInFromCol = fromColTasks.findIndex((t) => t.id === draggingId);

    taskHistoryRef.current = {
      ...taskHistoryRef.current,
      [draggingId]: { ...(taskHistoryRef.current[draggingId] ?? {}), [fromCol]: oldIdxInFromCol },
    };

    const insertIdx = isForward ? 0 : (taskHistoryRef.current[draggingId]?.[colId] ?? 0);
    const draggedId = draggingId;

    moveTasks((curr) => {
      const moved   = { ...curr.find((t) => t.id === draggedId)!, col: colId };
      const others  = curr.filter((t) => t.id !== draggedId);
      const result: Task[] = [];
      let destSeen = 0;
      let placed   = false;
      for (const t of others) {
        if (t.col === colId) {
          if (!placed && destSeen === insertIdx) { result.push(moved); placed = true; }
          result.push(t);
          destSeen++;
        } else {
          result.push(t);
        }
      }
      if (!placed) result.push(moved);
      return result;
    });

    triggerMoveEffects(draggingId, fromCol, colId, oldIdxInFromCol, task.title);
    setDraggingId(null);
  };

  // ---- Undo ----
  const undoMove = () => {
    const u = undoRef.current;
    if (!u) return;
    moveTasks((curr) => {
      const target = curr.find((t) => t.id === u.id);
      if (!target) return curr;
      const others = curr.filter((t) => t.id !== u.id);
      const moved  = { ...target, col: u.from };
      const result: Task[] = [];
      let destSeen = 0;
      let placed   = false;
      for (const t of others) {
        if (t.col === u.from) {
          if (!placed && destSeen === (u.fromIdx ?? 0)) { result.push(moved); placed = true; }
          result.push(t);
          destSeen++;
        } else {
          result.push(t);
        }
      }
      if (!placed) result.push(moved);
      return result;
    });
    undoRef.current = null;
    setHasUndo(false);
    closeToast();
  };

  // Flash a card with the success wash for ~2.8s
  const flashRecentMove = React.useCallback((id: string) => {
    if (recentMoveTimerRef.current) clearTimeout(recentMoveTimerRef.current);
    setRecentMoveId(id);
    recentMoveTimerRef.current = setTimeout(() => {
      setRecentMoveId(null);
      recentMoveTimerRef.current = null;
    }, 2800);
  }, []);

  const triggerMoveEffects = React.useCallback((
    id: string, fromCol: string, toCol: string, oldIdxInFromCol: number, taskTitle: string,
  ) => {
    flashRecentMove(id);
    const kindMap: Record<string, string> = { done: 'done', progress: 'progress', review: 'review' };
    const kind = kindMap[toCol];
    if (!kind) return;
    const colLabel = COLUMNS.find((c) => c.id === toCol)?.label ?? toCol;
    undoRef.current = { id, from: fromCol, fromIdx: oldIdxInFromCol };
    setHasUndo(true);
    setToast({ message: `Moved "${taskTitle}" → ${colLabel}`, kind: `success-${kind}` });
    setToastPhase('in');
    // Schedule auto-dismiss via the hook API (no direct timing side-effect in component)
    timersApiRef.current?.scheduleToastDismiss(closeToast);
  }, [flashRecentMove, closeToast]);

  const addHighlight    = (id: string) => setHighlight((s) => { const n = new Set(s); n.add(id);    return n; });
  const clearHighlight  = (id: string) => setHighlight((s) => { const n = new Set(s); n.delete(id); return n; });

  // ---- Sync sequence ----
  // Reads the latest tasks through a functional setState updater (no ref needed).
  // The updater captures from-column info into locals so the success wash + toast
  // can fire afterward with the same values.
  const syncMove = React.useCallback((id: string, toCol: string) => {
    let moveInfo: { fromCol: string; oldIdx: number; title: string } | null = null;
    timersApiRef.current?.captureFlip();
    setTasks((c) => {
      const task = c.find((t) => t.id === id);
      if (!task || task.col === toCol) return c;
      const fromCol = task.col;
      const oldIdx  = c.filter((t) => t.col === fromCol).findIndex((t) => t.id === id);
      moveInfo = { fromCol, oldIdx, title: task.title };

      const others = c.filter((t) => t.id !== id);
      const moved  = { ...task, col: toCol };
      const result: Task[] = [];
      let placed = false;
      for (const t of others) {
        if (!placed && t.col === toCol) { result.push(moved); placed = true; }
        result.push(t);
      }
      if (!placed) result.push(moved);
      return result;
    });
    timersApiRef.current?.scheduleFlip();

    if (moveInfo) {
      const { fromCol, oldIdx, title } = moveInfo;
      triggerMoveEffects(id, fromCol, toCol, oldIdx, title);
    }
  }, [triggerMoveEffects]);

  const startSync = () => {
    timersApiRef.current?.clearSyncTimers();
    moveTasks(() => INITIAL_TASKS);
    setHighlight(new Set());
    setFeed([]);
    closeToast();

    const steps = buildSequence({
      setPhase: setPhaseWithFlash, setStatus, setFeed, setSourceStates,
      moveTask: syncMove,
      highlight: addHighlight,
      clearHighlight,
    });

    let t = 0;
    steps.forEach((step) => {
      t += step.delay;
      const id = setTimeout(step.fn, t);
      timersApiRef.current?.registerSyncTimer(id);
    });
  };

  // Derived
  const tasksByCol = React.useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.id, [] as Task[]]));
    tasks.forEach((t) => { (map[t.col] || (map[t.col] = [])).push(t); });
    return map;
  }, [tasks]);

  const feedVisible = phase !== 'idle' && phase !== 'connecting';

  const outerSquircleRef = useSquircle<HTMLDivElement>();
  const panelSquircleRef = useSquircle<HTMLDivElement>();

  // ---- Callback ref: wires up timers API + handles phase reactions, plus the
  // squircle engine (composed since both need the same outer element) ----
  const boardRef = React.useCallback((el: HTMLDivElement | null) => {
    outerSquircleRef(el);
    if (el) {
      timersApiRef.current = makeTaskBoardTimers(el);
    } else {
      timersApiRef.current?.teardown();
      timersApiRef.current = null;
      if (recentMoveTimerRef.current) {
        clearTimeout(recentMoveTimerRef.current);
        recentMoveTimerRef.current = null;
      }
    }
  }, [outerSquircleRef]);

  // setPhaseWithFlash is called inside setTimeout step fns (not during render),
  // so calling timersApiRef.current here is safe — it runs after mount.
  const setPhaseWithFlash = React.useCallback((p: SyncPhase) => {
    setPhase(p);
    timersApiRef.current?.handlePhaseChange(p, setSyncBtnAnim);
  }, []);

  return (
    <div ref={boardRef} className="tb-outer">
      <div ref={panelSquircleRef} className="tb-panel">
        <Header total={tasks.length} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 10,
            padding: '0 16px 14px',
          }}>
            {COLUMNS.map((c) => (
              <Column
                key={c.id}
                col={c}
                tasks={tasksByCol[c.id]}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
                draggingId={draggingId}
                highlightIds={highlight}
                recentMoveId={recentMoveId}
              />
            ))}
          </div>

          {/* Toast layer — stays mounted, hidden via CSS visibility */}
          <div className={`tb-toast-layer ${toast && toastPhase === 'in' ? 'visible' : ''}`}>
            {toast && (
              <Toast
                message={toast.message}
                kind={toast.kind}
                phase={toastPhase}
                onUndo={hasUndo ? undoMove : null}
                onClose={closeToast}
              />
            )}
          </div>
        </div>

        {/* Sync feed — stays mounted, toggled via CSS visibility/opacity */}
        <SyncFeed items={feed} visible={feedVisible} />

        <div style={{ borderTop: '1px solid var(--tb-col-border)', background: 'var(--tb-feed-bg)' }}>
          <StatusBar
            sourceStates={sourceStates}
            statusText={statusText}
            phase={phase}
            onSync={startSync}
            syncedCount={4}
            syncBtnAnim={syncBtnAnim}
          />
        </div>
      </div>
    </div>
  );
}
