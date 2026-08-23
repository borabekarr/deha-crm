import { iconClass } from '@/lib/iconClass';
import { DOW } from './task-board-week-hook';

// Pure two-week day-pill row component, factored out of TaskBoard
// (react-doctor no-giant-component — same local pattern as
// task-board-reducer.ts / task-board-hook.ts, and TodoHeaderWeek.tsx in the
// sibling todo-list component). State + date helpers live in
// task-board-week-hook.ts (react-refresh/only-export-components: this file
// exports only the component, no non-component export alongside it).
// Byte-identical behavior to the inline version; only the module boundary
// moved.

// Local icon helper mirrors TaskBoard's SymIcon exactly (same className,
// style shape and glyph text) — kept local rather than imported from
// TaskBoard.tsx to avoid a circular module dependency. Not exported, so it
// does not trip react-refresh/only-export-components.
const WeekNavIcon = ({ name, size = 16 }: { name: string; size?: number }) => (
  <span className={iconClass(name)} style={{ fontSize: size, lineHeight: 1, fontVariationSettings: '"opsz" 24, "wght" 500' }}>
    {name}
  </span>
);

// Week pill row (Change 3) — mirrors todo-list's weekDays + activeIdx pattern
// and .td-daybtn recipe (todo-list/TodoList.tsx / TodoList.css), local tb- names.
// Step 5: two weeks (14 pills), one absolute activePillIdx (0-13) so exactly
// one pill is ever highlighted; filtering stays weekday-only (idx % 7).
export function WeekRow({
  weekDays,
  weekDays2,
  activePillIdx,
  onSelect,
  onPrevWeek,
  onNextWeek,
}: {
  weekDays: Date[];
  weekDays2: Date[];
  // Absolute index across all 14 visible pills (0-6 = week 1, 7-13 = week 2)
  // — display-only. Filtering still keys off the weekday (idx % 7), so which
  // physical pill is "active" never changes what tasks are shown.
  activePillIdx: number;
  onSelect: (i: number) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  return (
    <div className="tb-week-row">
      <button type="button" data-proximity className="tb-week-nav" aria-label="Previous week" onClick={onPrevWeek}>
        <WeekNavIcon name="chevron_left" size={16} />
      </button>
      <div className="tb-week">
        {weekDays.map((d, i) => (
          <button
            key={`w1-${d.toISOString().slice(0, 10)}`}
            type="button"
            className={`tb-daybtn hover-standard${i === activePillIdx ? ' active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <span className="dow">{DOW[i]}</span>
            <span className="dnum">{d.getDate()}</span>
          </button>
        ))}
      </div>
      {/* Thin quiet divider between the two visible weeks — keyed off
          --border-hairline so it stays visible in both themes (F14). */}
      <span className="tb-week-sep" aria-hidden="true" />
      <div className="tb-week">
        {weekDays2.map((d, i) => (
          <button
            key={`w2-${d.toISOString().slice(0, 10)}`}
            type="button"
            className={`tb-daybtn hover-standard${i + 7 === activePillIdx ? ' active' : ''}`}
            onClick={() => onSelect(i + 7)}
          >
            <span className="dow">{DOW[i]}</span>
            <span className="dnum">{d.getDate()}</span>
          </button>
        ))}
      </div>
      {/* margin-left:auto (tb-week-nav-end) pushes this flush to the card
          inner shell's right edge — asymmetric by design (F14). */}
      <button type="button" data-proximity className="tb-week-nav tb-week-nav-end" aria-label="Next week" onClick={onNextWeek}>
        <WeekNavIcon name="chevron_right" size={16} />
      </button>
    </div>
  );
}
