# Brief — Higgsfield open-source skills library (discussion, 2026-08-06)

**Status:** brainstorm only. No plan, no implementation.

**Repo URL:** https://github.com/higgsfield-ai/skills.git (v0.12.0, MIT, 9 skills; local clone in session scratchpad)

## Two-stack decision (Bora, 2026-08-06)

- **Landing page** = Higgsfield stack: Cloudflare Workers + TanStack Start + React 19 (+ bun), built with the `higgsfield-websites` skill — in a **separate project/repo** from the SaaS app, so the stacks never mix. No cross-imports, no shared build config; only the design language and Supabase are shared.
- **SaaS app (B2B/B2C)** = current deha-crm stack: Vite + React 18 + TS + Tailwind v4 + Shadcn.
- **Supabase is the DB on BOTH stacks** (supabase-js over HTTP from Workers instead of Cloudflare D1; the skill's D1/R2/KV assumptions need a swap — friction assessment pending re-eval).
- Consequence: the previously-SKIPped stack-bound files (SKILL.md, seo.md implementation half, security.md, auth.md, runtime-and-infra.md, containers.md, scroll-scrub) flip to candidate-INTEGRATE **for the landing-page project only**. The "2 files" verdict below was scoped to deha-crm's stack; the landing-page project inherits most of the skill wholesale.

## Gamification re-evaluation (2026-08-06, feel lens) — RICH

First sweep mis-lensed (streaks/XP). With gamification = **feel** (springs, tactile feedback, progress rings, inventory cards, one-tap playgrounds, HUD bars, sheets, glass depth), the repo is prime `gamified-feel` source material. Hits by Higgsfield layer:

**L1 iOS-native foundation:** `app-layouts.md` invariants — permanently dark (`data-theme="default-dark"` pinned, no light mode), no top bar, `max-w-7xl` container. `quanta-design.md` premium rules — space first (`p-4 md:p-6 xl:p-8`, `gap-4 md:gap-6`), "no card soup" (no cards-in-cards-in-cards), never emojis as icons / ONE icon family. Glass as a **button-variant ladder**: primary flat / secondary solid / tertiary = white/10 glass / ghost transparent. Segmented modes → Tabs, edge sheet → Vault.

**L2 Inventory cards (strongest find):** `app-layouts.md` is an inventory-gamification spec without the word — `preset.tsx` (persistent creation rail + browsable preset gallery, orientation matched to output), `generation-card` (generating state = **pulsing brand glow**; celebrate-subtly embedded in the object, not a banner), `history-grid` ("the user's OWN generations, personal, never a public feed" = the leaderboard substitution), `template-modal`/`template-picker` (two picker shapes), galleries preserve native aspect ratios ("artifacts, not a uniform grid"), `step-rail` (wizard progress), `before-after-compare` (visible growth via draggable slider).

**L3 One-tap playgrounds:** preview panel NEVER empty — seed with representative sample output; accepted generation becomes visible immediately (focus moves to it, pending polls in place, failures stay as retry-able cards, **composer/preset state preserved**); history inspectable in place (detail without navigation, arrow keys, closing restores tab/filter/scroll).

**L4 HUD + micro-interactions:** `rail-footer` = pinned sticky-bottom CTA with gradient scrim; **cost inside the button** (`{label} {sparkle} {credits}`), never a separate meter. Progressive disclosure with hard budget: ≤3 large + 4 compact fields visible, rest behind Accordion; "hidden, non-obvious scrolling is a bug". Quanta motion: 150-300ms micro / ≤400ms complex, **exit ≈ 60-70% of enter**, transform+opacity only, stagger 30-50ms, motion expresses cause-and-effect (panel slides from trigger side), **never block input while animating**. Tactile: every clickable = cursor-pointer + hover + pressed; `:active` `-translate-y-[1px]`/`scale-[0.98]` "physical push"; drag needs ~6px threshold + live tracking; skeletons shaped like final layout, never spinners. `image-to-code.md` "garments" = mastery micro-interaction catalog (stamp-press imprint, ticket perforation tear, decoding mono readout, material-swatch flip, viewfinder brackets, magnetic pill) — **rationed to ONE per page** (that rationing rule IS the "subtle"). `game-design-system.md` §8: instant acknowledgment + later echo; polish params (shake, hit-pauses, easing) as live-tunable config data; forgiving input tolerance; frame-pacing stability over average FPS.

**wow-catalog subtle-gamified subset** (all [S]/[C]/[W] SSR-tagged): dynamic-island, siri-orb, apple-activity-card (progress ring), contribution-graph, number-flow/animated-number/sliding-number, dock, expandable-card/card-stack, morphing-dialog/popover/transition-panel/disclosure, liquid-glass-card/progressive-blur/glow-effect/border-trail, hold-button/ripple-button/magnetic, wheel-picker/elastic-slider/slide-to-unlock, smooth-drawer. **Reject** (banner-and-badge register): confetti, sparkles-text, shimmer/rainbow/pulsating buttons, meteors, duolingo button.

**Scope conflict for the skill:** taste-file §9.F bans filled progress bars / status dots / per-row hairlines — correct for marketing pages, wrong for an in-product gamified HUD. `gamified-feel` must carry an explicit scope line exempting in-product progress affordances from those bans.

## Landing-page project re-verdict (Task B)

Flips to INTEGRATE wholesale for the separate landing repo: SKILL.md, website-flow, design-recipe, asset-system, review-rubric, runtime-and-infra, security, wow-maker/catalog, scroll-scrub (Tier-1 default; rubric 9f fails a site shipped without it unless explicitly `non-animated`), seo.md in full, image-to-code, reference-boards. Still SKIP even there: auth.md, fnf-sdk/fnf-react, quanta Layer 2, app-*.md — all `--type app` (Higgsfield-shell) only; a standalone landing page is `--type website` = "NO Higgsfield integration". Asymmetry: app-layouts.md is skipped for the landing page but is the best gamified-feel source.

**Supabase-instead-of-D1 friction: small.** Infra is opt-in via `app/app.manifest.json` — never set `"db": true` and there's nothing to rip out. Seam = `bindings.server.ts`: read SUPABASE_URL + service key as Worker secrets; supabase-js is fetch-based, runs on workerd unmodified. Migrations move to Supabase CLI (improvement — per-env projects vs the skill's single live D1). Gotchas: (1) no module-scope Supabase client holding a session (V8 isolate shares module state across requests — create per-request); (2) storage = Supabase Storage or opt-in R2, asset rules unaffected. (3) Rubric's "hero must be a real generated asset" assumes a Higgsfield account in the asset pipeline — need account or a documented local override.

## Evaluation results (2026-08-06 full scan — scoped to deha-crm's CURRENT stack)

**Bottom line:** one skill (`higgsfield-websites`) carries the repo, and two files carry that skill. The uptake is targeted extraction, NOT install — the executable half is welded to Higgsfield CLI + Cloudflare Workers + TanStack Start + React 19 + bun (we are Vite/React 18/Supabase). All other skills except `game-generation` are paid Higgsfield-API wrappers (no value without an account). **Zero literal gamification content in the repo** — but `higgsfield-game-generation/references/game-design-system.md` is a compressed game-design theory doc that restates white-hat Octalysis in engineering terms; it is the seed for `gamified-feel`.

**Extract (ADAPT/INTEGRATE):**
- `higgsfield-websites/references/design-taste-frontend.md` (1224 lines, "Anti-Slop"): §9.F production-test AI-tell ban list (version pills, `01 / INDEX` eyebrows, fake div dashboards in hero, `Scroll ↓` cues, middle-dot rationing), serif discipline (Fraunces/Instrument Serif banned by name, no mixed-family emphasis), banned beige/brass/espresso hex cluster, hero hard rules (viewport-fit, ≤20-word subtext, ≤4 text elements), shape-consistency + color-consistency locks. §1 three-dial system (DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY with brief-signal inference table) — adopt the framing, retune baselines for product UI (~4/3/5, not marketing-site 8/6/4). §5.D animation bans (no scroll listeners, no rAF loops touching React state, layout/layoutId only for real state changes) → fold into emil-design-eng.
- `review-rubric.md` §A: fully grep-able pre-ship gate (placeholder scan, em-dash, banned palette, h-screen→h-dvh, SSR-safety, reduced-motion pairing, opacity-0 scroll-reveal flags) → merges into ship-readiness-audit / why-rule hook style. Scope: project.
- `wow-catalog.md`/`wow-maker.md`: [S]/[C]/[W] SSR-safety tagging over ~80 Magic UI/Aceternity components — useful lookup table.
- `seo.md` (861 lines): strategy half worth diffing against seo-audit; implementation half TanStack-bound. Low priority.
- `game-design-system.md` §§2,7.2,8,9,10 → gamified-feel seed: discernible+integrated actions ("an empty slot = a dead mechanic"), one-pattern-at-a-time mastery, compression/expansion rhythm ("HUD arrow is the last resort"), instant acknowledgment + receipts, power-vs-challenge curve (soft slowdown never a wall, fix sinks not prices), three player limiters (multi-channel colorblind-safe perception; nothing instructional under load; system remembers the goal for the player), every refusal explains why + how to lift it, motivation = visible growth + real choices + responsive world.

**Skip:** quanta-design Layer 2, fnf-sdk, auth.md, runtime-and-infra, containers, security.md (Cloudflare-specific), scroll-scrub component, all generation-API wrapper skills. quanta-design Layer 1 duplicated by ux-principles + better-accessibility.

**Conflicts to respect:** the taste file targets marketing sites — variance-8 anti-center bias would fight calm-ui restraint, and its cards-only-for-hierarchy line contradicts our shell canon. Extract rules, never import the file wholesale.

## Why
Higgsfield's product is the reference balance point for "iOS-native elegance × rich gamification" (see `~/.claude/plans/i-want-to-speed-sorted-journal.md` decision 3). Their open-source skills library may carry directly reusable tech-stack guidelines and skill patterns.

## Task 1 — Evaluate the repo
- Route through `/evaluate-batch` (IRS rubric: Impact/Relevance/Specificity), scoped per scope-routing rules (global finds → claude-code-system via override marker; project finds → deha-crm `.claude-ext`).
- **Primary lens: frontend department** (dept-frontend) — tech-stack selection, component guidelines, design conventions. Check fit against Deha stack (React 18 / TS / Vite / Tailwind v4 / Shadcn / Supabase) before adopting anything.
- **Secondary sweep:** flag items useful to backend-data, marketing (SEO/GEO skill references), and any workflow/hook patterns worth lifting.
- Dedupe against existing library first (apple-design, apple-visual-feel, ux-principles/patterns, emil-design-eng, ai-seo, seo-audit…) — integrate deltas, not duplicates. `verify-before-claim` applies to any "replace/merge" recommendation.

## Task 2 — Mine it for the gamification skill
- Source material for the planned companion skill `gamified-feel` (sibling of `apple-visual-feel`, which stays an untouched 53-line one-pager).
- Skill contents already agreed: white-hat Octalysis drives only; HIG-wins conflict-resolution matrix; Higgsfield 4-layer pattern (iOS-native foundation → inventory-style visual gamification → one-tap template playgrounds → HUD bottom bars + progressive sheets); traditional-vs-Apple substitution table; cross-links to ux-principles Hooked rules (variable-reward, investment-loops, triggers) instead of duplicating them.
- Optional grounding: `/ingest` the 10-book gamification cluster already sitting in `knowledge/go-to-market/raw/` (actionable-gamification, the-gamers-brain, a-theory-of-fun, rules-of-play, art-of-game-design, addiction-by-design, designing-games, games-people-play, gamification-design-handbook, gamification-of-learning). Dedupe caveat: Hooked loop already distilled into ux-principles.
- Also consider: gamification additions as workflow/checklist items in redesign-ui / frontend-design flows, not only a standalone skill.

## No Higgsfield account (Bora, 2026-08-06 — final)

We are empowering our Claude Code system only; no Higgsfield product usage. Consequences:
- The 7 generation-API wrapper skills (brandkit, generate, soul-id, product-photoshoot, marketplace-cards, youtube-thumbnail, video-explainer) are **permanently SKIP**.
- Landing-page repo: the review-rubric's "hero must reference a real generated asset" item gets a **documented local override** — hero assets come from our own pipeline (GPT Image / our ad-creation-pipeline stack), not Higgsfield generation. Everything else in the Task B INTEGRATE list stands.

## Planning-ready work packages (input for Bora's next /planning runs)

1. **`gamified-feel` skill (global, claude-code-system)** — author from primary sources: the feel-lens findings above (app-layouts.md L1-L4 material, Quanta motion constants, garments catalog + one-per-page ration, game-design-system §8/§10, wow-catalog subtle subset with reject list), plus the Gemini synthesis 4-layer/substitution framing. Companion to untouched `apple-visual-feel`; include the HIG-wins conflict matrix AND the §9.F scope exemption (marketing-page bans on progress bars/status dots do NOT apply to in-product HUD affordances). Both skills upload to Claude Design together as a pair (decided: two separate skills, no merge).
2. **Anti-slop extraction (global)** — from `design-taste-frontend.md`: §9.F AI-tell ban list, hero/CTA hard rules, shape/color consistency locks, serif discipline, banned-palette families; three-dial framing retuned for product UI (~4/3/5 baseline). §5.D animation bans fold into `emil-design-eng`.
3. **Grep-rubric gate (project, deha-crm)** — `review-rubric.md` §A checks merged into `ship-readiness-audit` / hook style.
4. **Landing-page project bootstrap (separate repo, later)** — Higgsfield stack (Workers + TanStack Start + React 19) with Supabase swap per Task B notes (opt-out of D1 via manifest, secrets via bindings.server.ts, per-request supabase client, Supabase CLI migrations, hero-asset override).
5. **Book ingestion** — parked plan at `plans/book-ingestion.md` (gamification cluster first → path manifest → feeds package 1's skill authoring).

Local clone of the repo lives in session scratchpad (ephemeral); re-clone from the URL when executing packages 1-4.
