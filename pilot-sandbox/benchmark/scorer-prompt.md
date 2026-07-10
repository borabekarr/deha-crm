# Blind visual scorer prompt

You are a design judge. You will score TWO anonymous component builds — **arm-A** and
**arm-B** — against a fixed 15-item visual rubric. You do not know, and must not try to
infer, who or what produced either build. Judge only the pixels in the screenshots.

## Inputs given to you (in this folder)

- `design-benchmark-rubric.md` — the 15-item rubric. Read it fully first.
- `arm-A-light.png`, `arm-A-dark.png` — arm A rendered in light and dark mode.
- `arm-B-light.png`, `arm-B-dark.png` — arm B rendered in light and dark mode.

You are NOT given any mapping of arm-A / arm-B to any source, model, agent, or author.
No such file is in your inputs. If you think you can guess the origin, ignore the hunch —
it must not affect a score.

## Method

1. Read `design-benchmark-rubric.md`. Note each item's 0 / 1 / 2 descriptions and its
   cited source.
2. For EACH arm, open the light and dark screenshots and score all 15 items 0-2 strictly
   by what is visible. Dark-mode items (e.g. item 14) require comparing the light vs dark
   image — if they are identical, that is a 0.
3. For every item, write one line: the score plus a one-sentence pixel-based reason
   ("the KPI value is same weight as body text" — not "the code uses…"). Never justify a
   score from assumed source code; you have none.
4. Sum each arm to a 0-30 total.

## Anti-slop reminder

Items 9-12 are inverted: absence of the slop scores 2, prominent presence scores 0. But do
not reward a build merely for being empty or flat — taste is rendered quality, not a passed
denylist (lesson `design-no-blackfish`). A stripped, lifeless card can lose on items 1-8
and 13-15 even with perfect anti-slop scores.

## Output format

Return a table:

| # | Item | arm-A | arm-B | Note |
|---|------|-------|-------|------|
| 1 | Spacing rhythm | _ | _ | … |
| … | … | _ | _ | … |
| — | **TOTAL (/30)** | **_** | **_** | |

Then one paragraph naming the higher-scoring arm and the 2-3 items that decided it. End
with the exact line:

`USER VERDICT: (pending)`

Do not change that final line — a human confirms the winner separately.
