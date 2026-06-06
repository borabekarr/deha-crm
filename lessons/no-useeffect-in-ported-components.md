---
name: no-useeffect-in-ported-components
description: When porting an HTML/vanilla-JS or React-UMD prototype into the app, the imperative lifecycle code (timers, intervals, subscriptions, animation loops) maps to useEffect by default. The project rule forbids raw useEffect in components. Extract every effect into named custom hooks in a *-hook.ts file, and reset per-entity state with a key prop instead of an effect.
metadata:
  type: lesson
  category: regression
  incident-date: 2026-06-06
verification-command: |
  grep -cE "useEffect\s*\(" apps/web/src/components/design-system/leads-table/LeadPopover.tsx
---

# Lesson: Ported prototypes hide useEffect; extract to *-hook.ts

## What happened

The Deha leads-table popover was ported from `_lead-popover.jsx` (React 18 UMD +
Babel). The first port carried the prototype's lifecycle code straight across as
8 raw `useEffect` calls in `LeadPopover.tsx` (tween loop, pill measure, typewriter
timer, cold-drop countdown, scroll reset, edge recheck, Esc listener, per-lead
reset). The Step 7 React-gate failed: the project rule (`.claude/skills/no-use-effect`)
forbids raw `useEffect` inside components.

## Root cause

Imperative prototypes express every side effect as inline lifecycle code. A
naive 1:1 port turns each one into a component-level `useEffect`, because that is
the mechanical equivalent. The rule is not that effects are banned, but that they
must be encapsulated behind named custom hooks so components stay declarative.
A 1:1 port skips that encapsulation step.

## How to apply this lesson

- Before porting, list the prototype's timers, intervals, listeners, and
  animation loops. Each becomes one named custom hook (`useTween`, `useCountdown`,
  `useTypewriter`, `useEscToClose`), placed in a `*-hook.ts` file. That file is
  the only place `useEffect`/`useLayoutEffect` may appear.
- Replace "reset state when the entity changes" effects with a `key` prop on the
  component (remount resets state) rather than an effect that watches the id.
- Keep impure calls out of render: use lazy `useState` initializers for derived
  initial state, not top-of-render computation.
- Verify with `grep -cE "useEffect\(" <Component>.tsx` returning 0 before claiming
  the port is done.
