<!-- structure adapted from vercel-design-md; values are Deha's own (truth: colors_and_type.css) -->
<!-- Value source of truth: apps/web/design-system/colors_and_type.css and design-tokens.json. Do not hand-edit hex values here; regenerate from those files if tokens change. -->

# Deha CRM — Design

One brand color, glass-card surfaces, 4px spacing, restrained motion. This file is the
machine-readable and human-readable contract for anything touching UI in this repo.

```yaml
colors:
  brand_primary: "#10B981"      # Emerald-500 — the only brand color
  slate_900: "#0F172A"          # fg1 — primary text
  slate_700: "#334155"          # fg2 — strong body
  slate_500: "#64748B"          # fg3 — secondary text
  slate_400: "#94A3B8"          # fg4 — tertiary text / hairline dark
  slate_200: "#E2E8F0"          # border-hairline — default border
  slate_100: "#F1F5F9"          # bg-chip — chip / pill background
  semantic_success: "#10B981"
  semantic_warning: "#EAB308"
  semantic_danger: "#EF4444"
  semantic_hot: "#F97316"
typography:
  fontFamily: "'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif"
  fontWeight: [500, 600, 700, 800, 900]
  fontSize:
    display1: "36px"
    h1: "28px"
    h4: "16px"
    body: "14px"
    meta: "12px"
  lineHeight: { tight: 1.15, snug: 1.35, relaxed: 1.6 }
  letterSpacing: { tight: "-0.02em", wide: "0.05em", widest: "0.15em" }
spacing_scale_px: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48]
motion_intent: 2
```

## Colors

Every hex below is transcribed verbatim from `apps/web/design-system/colors_and_type.css`. Each
step in the scale ENCODES A ROLE — use the role, not the raw hex, in component code.

- `#10B981` (`--brand-primary` / `--fg-brand` / `--bg-accent`) — the only brand color; primary
  actions, active state, brand accents.
- `#0F172A` (`--fg1`, dark-mode `--bg-app`) — primary text on light; app background on dark.
- `#334155` (`--fg2`) — strong body text, secondary headings.
- `#64748B` (`--fg3`) — secondary/meta text, placeholder text.
- `#94A3B8` (`--fg4`) — tertiary text, disabled labels, micro-labels.
- `#E2E8F0` (`--border-hairline`, `--slate-200`) — default border on light surfaces.
- `#F1F5F9` (`--bg-chip`, `--slate-100`) — chip / pill / muted background.
- `#FFFFFF` (`--bg-app`, `--fg-inverse`) — page background; text on brand-colored surfaces.
- `#EAB308` (`--semantic-warning`) on `#FEFCE8` bg — medium-priority states.
- `#EF4444` (`--semantic-danger`) on `#FEF2F2` bg — errors, destructive actions, urgent priority.
- `#F97316` (`--semantic-hot`) on `#FFF7ED` bg — "Hot Lead" badge only.

Dark mode swaps roles, not hexes: `--fg1` becomes `#F1F5F9`, `--bg-app` becomes `#0F172A`. Never
invent a new hex; every color in a component must resolve to a token above.

**Primary theme palettes:** the design system ships five extra primary palettes (sunflower,
bloodymary, petalglow, sexyblue, richgold), remapped via `:root[data-primary=...]` attribute
selectors in `colors_and_type.css` and cycled by the gallery's PrimaryThemeSwitcher; emerald is
the default with no attribute set. `--brand-on-primary` flips on-primary text to `#111111` for
the light-primary themes (sunflower, richgold).

## Typography

- Font: `'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif` (`--font-display`),
  loaded via `<link>` `preconnect` + `display=swap`, never `@import`.
- Weights: 500 body-medium, 600 semibold labels, 700 bold headings, 800 buttons, 900 KPI numerals
  (mandatory for metric displays).
- Scale: display-1 `36px` (metric numerals) down to mini `10px` (axis labels). Page title uses
  h1 `28px`; card heading uses h4 `16px`; body copy `14px`; meta/chip text `12px`.
- Line-height: `1` for display numerals, `1.15` tight for headings, `1.35` snug for card copy,
  `1.6` relaxed for long-form body.
- Letter-spacing: `-0.02em` tight on headings/numerals, `0.05em`–`0.15em` wide/widest on
  uppercase micro-labels only.

## Spacing

4-point scale only: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48` px. No arbitrary pixel values.

- `4px` — icon-to-label gap inside chips/pills.
- `8px` — tight internal gaps (button icon gap).
- `16px` — page padding; the default inset for most containers.
- `24px` — card-to-card gap; the standard section rhythm unit.
- `32px`+ — page-section separation only, never inside a single card.

## Radius

- `6px` (`xs`) — smallest chips.
- `8px` (`sm`) — tiny badges.
- `12px` (`md`) — inputs, compact controls.
- `16px` (`lg`) — buttons, inner cards.
- `20px` (`xl`) — sub-cards, list items.
- `24px` (`2xl`) — hero cards, chart cards, modals — the default "big card" radius.
- `16px` (`pill`) — chip/filter/badge pill shape.
- `9999px` (`circle`) — avatars, dots only.

## Elevation

- `--shadow-glass-sm` — resting glass card: `0 1px 2px rgba(0,0,0,.05)` + inset top-highlight.
- `--shadow-glass` — standard elevated card: layered `4px`/`2px` offsets + inset top-highlight.
- `--shadow-emerald-glow(-sm)` — reserved for brand-accent surfaces (primary button, CTA banner)
  only; never stack glow on a non-brand-colored element.
- `--shadow-recessed` — inset shadow for pressed/recessed controls (segmented control track).
- Blur: `20px` (`--blur-glass`) for standard glass cards, `40px` (`--blur-strong`) for hero cards.

## Breakpoints

Mobile-first; design the 375px case first.

| Prefix | Width | Usage |
|---|---|---|
| (none) | 0px+ | Mobile base case |
| `sm:` | 640px+ | Large phones |
| `md:` | 768px+ | Tablets/laptops — primary breakpoint, handles 90% of cases |
| `lg:` | 1024px+ | Desktops |
| `xl:` | 1280px+ | Large desktops (rare) |
| `2xl:` | 1400px+ | Ultra-wide, container max-width |

## Motion

`motion_intent: 2` — motion only when it clarifies a change; never decoration.

- Default duration is `0ms` — no animation is often correct.
- `150ms` for state changes (hover, toggle, checkbox).
- `200ms` for popovers and tooltips.
- `300ms` for overlays and modals.
- Easing: ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for everything above. Never bounce or
  elastic easing — this specifically bans the overshoot ease-in-out-back curve; if a
  bezier's third and fourth values push past `1`, it does not belong in this codebase.
- No long-running, looping, or attention-grabbing animation.
- Animate only `transform` and `opacity` — never `width`, `height`, `top`, `left`, `margin`,
  `padding` (layout thrash).
- Wrap non-essential animation in `@media (prefers-reduced-motion: reduce) { animation: none; }`.
- Durations and easing resolve to `var(--duration-*)` / `var(--ease-*)` tokens, wrapped with
  `calc(<n>ms * var(--anim-mult))` wherever the Slow-Down toggle should scale them.

## Voice & Content

<!-- adapted from vercel-design-md (voice-content-rules) -->

- Title Case for labels, buttons, page titles, and tabs. Sentence case for body copy, helper
  text, and toasts.
- Name actions with verb + noun ("Save Lead", "Delete Contact") — never bare "Confirm" or "OK".
- Errors state what happened, then what to do next ("Couldn't save lead. Check your connection
  and retry.").
- Toasts name the changed thing, drop the trailing period, and never say "successfully"
  ("Lead updated", not "Lead was successfully updated.").
- Empty states point to the first action a user should take, not just a description of the void.
- Use numerals ("3 leads"), never spell out numbers. Skip "please". No marketing superlatives
  ("best-in-class", "revolutionary", "seamless").

## Do's and Don'ts

- Do use semantic tokens (`--fg1`, `--brand-primary`, `--space-4`) over raw hex or pixel values
  in new component code.
- Do keep one accent color per view — `--brand-primary` is the only brand color.
- Don't invent a new hex, radius, or duration value — every value here traces back to
  `colors_and_type.css` or `design-system.md` §10. **Carve-out (2026-07-13):** proximity hover
  is exempt — `hover-tokens.css` legitimately animates `scale`/`filter` and defines its 6 hover
  tokens outside `colors_and_type.css`; see `design-system.md` §10 and
  `design-system-extended.md` §17.
- Don't animate layout properties; don't use bounce/elastic easing; don't skip
  `prefers-reduced-motion`.
- Don't ship an interactive element missing hover/focus/active/disabled states.
- Don't write toast copy with "successfully" or a trailing period.
