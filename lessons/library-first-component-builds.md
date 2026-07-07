---
name: library-first-component-builds
description: New components must be built by reusing and referencing the project's finished UI library first, or they lose to reference exports on proportion and density despite passing every automated gate.
metadata:
  type: lesson
  category: contract-drift
  incident-date: "2026-07-04"
verification-command: grep -q "library-first" /home/bora/claude-code-system/.claude/agents/dept-frontend.md
---

# Lesson: Build from the finished component library first

## What happened

Two separate wheel-picker rebuilds passed every automated gate (palette, mount, useEffect) and the user still judged both worse than Claude Design's version. Measured against the export: weak title hierarchy, loose row rhythm instead of a tight 44px grid, a chunky tinted selection band instead of a hairline band, and web-style bottom buttons instead of the expected iOS header. Neither build ever opened `apps/web/src/components/design-system/date-picker/`, which already contains complete, approved wheel mechanics (fade masks, scroll-snap, wheel labels), or `model-selection-sheet/`, which already contains complete, approved bottom-sheet chrome (scrim, drag handle, dark mode, animation discipline).

## Root cause

**Why:** Claude Design performed well because its project context physically contains the finished library, so every layout decision is anchored to an already-approved reference. Our pipeline built the picker from a text brief in a context-free sandbox, so the builder reinvented wheel and sheet mechanics from scratch instead of reusing the finished ones sitting one directory away. Automated gates check format and invariants (does it compile, is the palette valid), not gestalt, so a component can pass every gate while still missing the proportion and density of the thing it was supposed to match.

## How to apply this lesson

**How to apply:**
- Before writing any new markup, search `apps/web/src/components/design-system/` (registry file plus directory listing) for a same-pattern component. If one exists, reuse it directly; do not rebuild its mechanics.
- Treat in-progress or partially-finished components in the library as references too, not just completed ones. Mine the closest ones for density, dimensions, and chrome patterns even when building standalone.
- Name every consulted library component explicitly in the return contract (e.g. "reused date-picker wheel mechanics, model-selection-sheet chrome"). If no relevant component exists, state that explicitly rather than silently skipping the search.
- When a visual reference exists (user-provided export, screenshot, or a named library sibling), run a screenshot-compare loop against it and iterate until dimensional parity, instead of relying on automated gates alone.

## Integration check

`dept-frontend.md` carries the library-first mandate (tier-1 reference to `apps/web/src/components/design-system/**`, library search before build, screenshot-compare in VERIFY when a reference exists) from this plan's Step 4, and `memory/project_design-system-lockin.md` records the round-2 outcome that automated gates verify invariants, not gestalt.
