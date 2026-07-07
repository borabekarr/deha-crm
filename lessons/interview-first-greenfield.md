---
name: interview-first-greenfield
description: Greenfield component builds must interview the user on format, container, actions, interaction depth, and variant count before writing a brief, or the build risks a full rebuild on requirements mismatch.
metadata:
  type: lesson
  category: contract-drift
  incident-date: "2026-07-04"
verification-command: grep -q "AskUserQuestion" lessons/interview-first-greenfield.md
---

# Lesson: Interview before briefing any greenfield component

## What happened

Two parallel attempts built the same wheel-picker component. One (Claude Design) asked the user five clarifying questions up front: time format, container, buttons, wheel behavior, and number of variations. It won requirements fit on the first pass. The other build skipped the interview, wrote a brief from assumptions, and required a full rebuild once the mismatch surfaced.

## Root cause

**Why:** For a greenfield component there is no existing implementation to anchor assumptions against, so every unstated requirement gets filled in by guesswork. The five dimensions that mattered (format, container, actions, interaction depth, variant count) were all things the user had an opinion on but hadn't been asked about, so the guess and the requirement diverged in ways no amount of polish on the wrong shape could fix.

## How to apply this lesson

**How to apply:**
- Before writing a brief for any greenfield component, ask the user via `AskUserQuestion` about: format, container, actions/buttons, interaction depth (e.g. wheel/gesture behavior), and variant count.
- Skip the interview only when the user has already supplied answers to these five dimensions unprompted in the request.
- Treat the interview as happening before the brief is drafted, not after -- a brief written from assumptions and corrected later costs a full rebuild, not a patch.

## Integration check

Greenfield component requests route through an `AskUserQuestion` step covering format/container/actions/interaction-depth/variant-count before a brief is written; briefs for such components record the user's answers rather than assumed defaults.
