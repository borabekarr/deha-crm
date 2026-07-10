---
name: design-benchmark-rubric
description: "15-item blind visual scoring rubric for the two-arm design benchmark; each item scored 0-2 against a cited line in the Deha design-system reference or the make-interfaces-feel-better checklist."
summary: "Blind 0-2 visual rubric (15 items, 30 pts) for grading benchmark component screenshots against cited design-system and surface-polish rules."
tags: [design-system, benchmark, rubric, visual-scoring, blind-review, deha-crm]
---

# Design Benchmark Visual Rubric

Score each **rendered screenshot** (light + dark) of a component against the 15 items
below. This rubric grades pixels, not source: judge only what you can see in the image
per lesson `design-no-blackfish` (Rule 7 — green checks are not proof; only a rendered
view is). Each item is worth **0, 1, or 2**. Maximum **30 points** per arm.

Every item cites its source of authority:

- **DS** = `/home/bora/deha-crm/.claude/references/frontend/design-system.md`
  (readable via the `.claude/references` symlink), cited by section and line.
- **MIFB** = `/home/bora/deha-crm/.claude/skills/make-interfaces-feel-better/SKILL.md`,
  cited by principle and checklist line.

Anti-slop items (9-12) invert: a **2** means the slop is fully absent, a **0** means it
is present and prominent. Taste is judged by rendered quality, never by a denylist alone
(lesson `design-no-blackfish` Rule 3).

---

## Scoring items

### 1. Spacing rhythm
**Source:** DS §3 Spacing Grid (lines 87-90) — "All spacing must use the 4px scale: 4, 8, 12, 16, 24, 32…"
- **0** — Cramped or arbitrary gaps; elements touch or crowd; no consistent rhythm.
- **1** — Mostly on a grid but one or two off-scale gaps break the rhythm.
- **2** — Consistent 4px-scale rhythm; breathing room reads as deliberate and even.

### 2. Visual hierarchy
**Source:** DS §2 Typography Scale (lines 52-64) — semantic heading scale, "heading-emphasis for numbers and critical words."
- **0** — Everything one weight/size; no clear primary element; eye has no entry point.
- **1** — Some hierarchy but the most important value does not clearly dominate.
- **2** — Immediate focal point; size/weight/color guide the eye top-down in order.

### 3. Optical alignment
**Source:** MIFB Principle 2 (lines 31-33) + checklist (line 123) — "When geometric centering looks off, align optically."
- **0** — Icons/labels visibly off-center; ragged edges; nothing lines up on a common axis.
- **1** — Geometrically aligned but an icon or glyph reads visually off-center.
- **2** — Everything sits on shared optical axes; icons look centered, not just measured.

### 4. Concentric border radii
**Source:** MIFB Principle 1 (lines 27-29) + DS §12 Border Radius (lines 242-254) — "Outer radius = inner radius + padding."
- **0** — Same radius on parent and child, or sharp-inside-round mismatch; corners fight.
- **1** — Radii differ but not by the padding offset; slightly off concentricity.
- **2** — Nested corners are concentric; inner radius = outer minus padding.

### 5. Shadow quality
**Source:** MIFB Principle 3 (lines 35-37) + checklist (line 124) — "Layer multiple transparent box-shadow values for natural depth."
- **0** — Hard 1px border doing all the work, or a single flat gray drop shadow.
- **1** — One soft shadow present but flat; depth reads as a sticker, not a surface.
- **2** — Layered transparent shadows give believable elevation that adapts to the bg.

### 6. Color discipline
**Source:** DS §1 Color System (lines 17-48) + anti-patterns 4/16 (lines 125, 137) — "One accent color per view max"; "all neutrals must have >=0.01 chroma."
- **0** — Multiple competing accents, or pure gray/black neutrals reading dead.
- **1** — One accent but a stray second hue, or a flat neutral or two.
- **2** — Single disciplined accent; neutrals subtly tinted; palette reads as one system.

### 7. Numeric typography
**Source:** MIFB Principle 6 (lines 47-49) + DS §2 (line 74) — "tabular-nums for dynamically updating numbers"; "900 weight for KPI values — mandatory for metrics."
- **0** — Metrics same weight as body; numbers visibly jitter/misalign in columns.
- **1** — Numbers emphasized but not tabular, or KPI weight under 900.
- **2** — Key figures heavy (700-900), tabular, and column-aligned; numbers feel engineered.

### 8. Hit areas
**Source:** DS §3 (line 92) + MIFB Principle 13 (lines 75-77) / checklist (line 135) — "minimum 44x44px"; "at least 40x40px hit area."
- **0** — Tap targets look under ~32px; controls cramped edge-to-edge.
- **1** — Most targets adequate but one or two feel tight.
- **2** — All interactive targets read comfortably >=40-44px with clear separation.

### 9. Anti-slop: gradient restraint
**Source:** DS anti-patterns 1-2 (lines 122-123) — "No gradients unless requested"; "No purple/multicolor gradient combos — brand palette only."
- **0** — Purple-blue or multicolor gradient present as a primary surface.
- **1** — A subtle unrequested gradient wash that is not brand-disciplined.
- **2** — No purple/multicolor gradient; any tint stays inside the brand palette.

### 10. Anti-slop: shadow restraint
**Source:** DS anti-pattern 3 (line 124) — "No glow effects as primary affordances — use shadow-sm."
- **0** — Gaudy stacked drop-shadows or a colored glow used as the main affordance.
- **1** — Shadow slightly overdone; a faint glow competes with content.
- **2** — Depth is purposeful; no glow-as-affordance, no decorative shadow pile-up.

### 11. Anti-slop: icon discipline
**Source:** DS §8 Icons (line 178) + anti-pattern 22 (line 143) — "material-symbols-outlined only. Never Lucide/Heroicons/Font Awesome"; "single consistent icon library."
- **0** — Emoji icons, or a visible mix of icon families.
- **1** — One icon family but an occasional emoji or off-set glyph.
- **2** — Single coherent icon family (material symbols), zero emoji.

### 12. Anti-slop: no hollow placeholders
**Source:** DS anti-pattern 5 (line 126) — "Empty states must include one clear action CTA."
- **0** — Empty/hollow placeholder cards or dead zones with no content or CTA.
- **1** — A thin area that reads as filler though not fully empty.
- **2** — Every region earns its space; any empty state carries a clear CTA.

### 13. Interactive states
**Source:** DS anti-pattern 18 (line 139) + MIFB Principle 9 (lines 59-61) / checklist (line 131) — "all states: hover, focus, active, disabled"; "scale(0.96) on press."
- **0** — Buttons look inert; no visible affordance for hover/press/focus.
- **1** — Primary affordance styled but states look partial (e.g. no focus ring).
- **2** — Clear tactile affordances; primary control reads pressable with a focus ring.

### 14. Dark mode fidelity
**Source:** DS §13 Dark Mode (lines 259-274) — "Every component must support dark mode"; card/text/border dark variants.
- **0** — Dark screenshot identical to light, or unreadable contrast in dark.
- **1** — Dark mode works but a surface or text tint is off; contrast marginal.
- **2** — Purposeful dark surfaces, legible text, accent holds; both modes feel first-class.

### 15. Text finishing
**Source:** MIFB Principles 5 & 7 (lines 43-53) — "font-smoothing antialiased"; "text-wrap: balance on headings, pretty for body."
- **0** — Ragged single-word orphans on headings; heavy/aliased text.
- **1** — Text readable but wrapping is awkward or smoothing not applied.
- **2** — Balanced headings, no orphans, crisp antialiased text.

---

## Totals

- Per-arm total = sum of 15 items, **0-30**.
- Record each item as `A:<0-2>  B:<0-2>` with a one-line pixel-based justification.
- The winner is the higher total; note any item where the gap is >=1 as a decisive factor.
- Final line stays `USER VERDICT: (pending)` until a human confirms — the human eye is the
  tiebreaker on any taste signal (lesson `design-no-blackfish` Rule 10).
