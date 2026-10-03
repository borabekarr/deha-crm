import React from 'react';

// Pure state-shape + date helpers for the two-week day-pill row, split out
// of TaskBoardWeekRow.tsx (react-refresh/only-export-components: a module
// exporting a component must not also export a non-component, or Fast
// Refresh breaks for it). Mirrors task-board-hook.ts / task-board-reducer.ts
// — both non-component modules sitting alongside their component files.

export const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Today's index — computed once at module level, Mon=0…Sun=6.
const TODAY_IDX = (new Date().getDay() + 6) % 7;

// Builds the Mon–Sun span for the week `offset` weeks from the current one.
function buildWeekDays(offset: number): Date[] {
  const monday = new Date();
  monday.setDate(monday.getDate() - TODAY_IDX + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
  });
}

// Two-week pill-row state + navigation. activePillIdx is an absolute index
// across all 14 visible pills (0-6 = week 1, 7-13 = week 2), display-only —
// exactly one pill is ever highlighted. Filtering keys off the weekday
// (activePillIdx % 7), unchanged from the single-week behavior, so which
// pill is "active" never changes which tasks are shown.
export function useWeekRow() {
  const [activePillIdx, setActivePillIdx] = React.useState<number>(TODAY_IDX);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const weekDays = React.useMemo(() => buildWeekDays(weekOffset), [weekOffset]);
  // Second visible week (two weeks shown at once). Pressing the right arrow
  // bumps weekOffset by one, so this week's dates slide into the first slot
  // and a new week appears here — no separate index needed.
  const weekDays2 = React.useMemo(() => buildWeekDays(weekOffset + 1), [weekOffset]);
  const activeWeekday = activePillIdx % 7;

  const onPrevWeek = React.useCallback(() => {
    setWeekOffset((o) => o - 1);
    // Old week 1 slides into the week 2 slot (still visible) — track the
    // same calendar day there. Old week 2 scrolls off entirely — fall back
    // to "same weekday carries over" (index unchanged), which now lands on
    // the new week 2 (never leaves 0 pills lit).
    setActivePillIdx((p) => (p < 7 ? p + 7 : p));
  }, []);

  const onNextWeek = React.useCallback(() => {
    setWeekOffset((o) => o + 1);
    // Old week 2 slides into the week 1 slot (still visible) — track the
    // same calendar day there. Old week 1 scrolls off entirely — fall back
    // to "same weekday carries over" (index unchanged), which now lands on
    // the new week 1.
    setActivePillIdx((p) => (p >= 7 ? p - 7 : p));
  }, []);

  return { weekDays, weekDays2, activePillIdx, setActivePillIdx, activeWeekday, onPrevWeek, onNextWeek };
}
