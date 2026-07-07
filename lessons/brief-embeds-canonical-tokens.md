---
name: brief-embeds-canonical-tokens
description: Sandboxed or offline component briefs must embed canonical design-token values verbatim, not paraphrase them, or the design system leaks values it never approved.
metadata:
  type: lesson
  category: contract-drift
  incident-date: "2026-07-04"
verification-command: grep -q "token-fidelity-gate.sh" lessons/brief-embeds-canonical-tokens.md
---

# Lesson: Embed canonical design tokens verbatim in sandboxed component briefs

## What happened

A brief for a wheel-picker component, built in a sandboxed/offline environment with no access to the live design system, described the accent color in prose as "a green accent, oklch." The builder interpreted that description and shipped hue 152, which reads as a different green than the canonical emerald accent (`#10B981`, hue 162.5). The component passed every downstream review because every gate checked format (is it a valid oklch value, does it look green) rather than the actual value.

## Root cause

**Why:** Paraphrasing a design token turns a fixed value into a judgment call. The brief was the single point where the design system's authority left the pipeline: once "the canonical emerald `#10B981`" became "a green accent," any hue in the green family satisfied the instruction. No downstream check re-derived the correct value from source, because none of them had access to `design-tokens.json` either -- they only had the same paraphrase to go on.

## How to apply this lesson

**How to apply:**
- When writing a brief for any sandboxed or offline component build, paste the exact token values verbatim from `apps/web/design-system/design-tokens.json` (accent, neutrals, radii, surface recipes) into the brief itself. Do not summarize or describe them in prose.
- If pasting the full table is impractical, grant the builder the manifest path (`apps/web/design-system/design-tokens.json`) directly instead of relaying values secondhand.
- Before accepting the finished artifact, run `apps/web/design-system/tools/token-fidelity-gate.sh` against it to confirm the shipped values match the canonical tokens, not just that they are structurally valid.

## Integration check

`apps/web/design-system/tools/token-fidelity-gate.sh` exists and is run against sandboxed/offline component artifacts before acceptance; briefs for such builds contain a pasted token table or an explicit manifest-path reference instead of a prose color description.
