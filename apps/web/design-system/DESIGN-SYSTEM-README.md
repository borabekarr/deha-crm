# Deha Design System

Deha is the **"Smartest CRM"** — a customer-relationship-management product positioned as a vertical-friendly platform that can be specialised for **Real Estate, Healthcare, Hotels, and Small-to-Medium Sales Teams**. The product positions AI ("AI-matched properties", "What-If Budget Simulator", "Predicted Value", "Hot Lead" scoring) as a first-class citizen of the dashboard and uses gamification ("Personal Goal Tracker", "Leaderboard", Top-1% badges) to drive daily salesperson engagement.

The brand the user supplied is built for **mobile-first** consumption. Copy mixes Turkish and English in the same surface (`Hoş geldin Bora!` next to `View Your Leads`), implying a Turkish-Türkiye market with English product chrome — a common pattern in TR SaaS.

## Sources

- `uploads/code.html` — A full mobile dashboard mock built with Tailwind CDN + Material Icons + Montserrat. This is the primary source of truth for the visual language (colors, radii, glass shadows, typography). All tokens in `colors_and_type.css` are derived from here.
- `uploads/screen.png` — A rendered screenshot of the same dashboard. Use only as a sanity check; the code is authoritative.

No Figma file, no logo SVG, and no production codebase were provided. Where assets are missing (notably the wordmark/logo and any iconography that isn't Material Icons), this system flags substitutions and asks the user to supply originals.

## Products

There is **one product surface** evidenced so far:

1. **Deha CRM — Mobile dashboard** (Turkish + English). Primary user is a real-estate agent ("Bora") tracking leads, appointments, revenue, and goals. Uses a single emerald primary against a near-white background with heavy glass / backdrop-blur cards.

(Marketing site, desktop CRM, and other vertical configurations — Healthcare, Hotels, SMB — are alluded to but not present in the uploads.)

## Index

- `README.md` — this file (context + content fundamentals + visual foundations + iconography)
- `colors_and_type.css` — design tokens (color, type, radius, shadow, spacing)
- `SKILL.md` — agent skill manifest, also usable as a Claude Code skill
- `assets/` — logos, brand marks, sample imagery, full-bleed backgrounds
- `preview/` — design-system cards rendered for the Design System tab
- `ui_kits/crm-mobile/` — JSX components + interactive `index.html` for the mobile CRM
- `uploads/` — original source materials from the user

## Content Fundamentals

Deha's copy is **bilingual**, **direct**, and **person-first**. It addresses the user by first name and uses informal Turkish ("Hoş geldin Bora!" — "Welcome Bora!" with the *sen* form, not *siz*) intermixed with declarative English product strings.

- **Languages.** Turkish handles greetings, navigation, and task content (`Görevler`, `Tümü`, `Yüksek`, `Orta`, `Düşük`, `Tüm Görevleri Gör`, `Kendimle Karşılaştır`, `Rakiplerle Karşılaştır`, `Son 30 Gün`). English handles product-noun chrome and metric labels (`Dashboard`, `New Leads`, `Predicted Value`, `Leaderboard`, `Queries and Appointments`, `Personal Goal Tracker`, `"What-If" Budget Simulator`, `Daily Spend`, `Monthly Leads`, `Exp. Revenue`). Keep this split when writing new copy — translate UI nouns last.
- **Voice.** Second person, informal. "Your dashboard is already analyzing leads." "Check out your AI-matched properties and conversion pipeline." Speak *to* the agent, not *about* them.
- **Casing.** Title Case for card headers and section titles. Sentence case for body copy. UPPERCASE WITH WIDE TRACKING is used sparingly for tiny labels (`FULL NAME`, `REVENUE`, `PERSONAL GOAL TRACKER`).
- **Quantification.** Numbers do the talking. Big numerals (`142`, `48`, `$1.2M`, `₺1,380,000`) carry meaning; supporting copy stays terse (`+12% vs last month`, `34% conversion`, `5m 12d 14h`, `CPL: ₺112.5`). Always pair a number with a small trend chip (▲ +12%) and a comparison string when possible.
- **Currency.** Both `$` and `₺` appear, sometimes side-by-side (revenue in USD; ad spend in TRY). Don't normalise; the duality is part of the brand voice.
- **Tone vibe.** Optimistic, momentum-driven, gently competitive. "Top 1%", leaderboards, goal tickers, "What-If" simulators. Never apologetic, never neutral. The product wants to make a salesperson feel like they are winning.
- **Emoji.** Not used. Iconography is carried by Material Icons / Material Symbols, *never* emoji.
- **Punctuation.** Em-dashes are rare. Exclamation marks appear in greetings (`Hoş geldin Bora!`, `Welcome to Deha CRM!`) but not elsewhere — keep them for warmth, not for emphasis.

### Example copy
- "Hoş geldin Bora! İşletmenle ilgili son gelişmeler." (Welcome Bora! Latest about your business.)
- "Welcome to Deha CRM! Your dashboard is already analyzing leads. Check out your AI-matched properties and conversion pipeline."
- "The data in this area is updated daily based on daily advertising results."

## Visual Foundations

Deha's visual language is **bright, glassy, and gamified**. A single emerald accent (`#10B981`) does almost all the heavy lifting; everything else is slate/neutral. The aesthetic sits between iOS 17 "liquid glass" and a fitness-tracker dashboard — translucent cards floating over a soft radial gradient, every metric framed as an achievement.

### Color
- **Primary:** Emerald `#10B981`. Used as a saturated fill on hero cards, CTA backgrounds, the active "Daily" pill, leaderboard winner row accent, chart strokes, and the brand mark.
- **Background:** A radial gradient from `emerald-50` (top-right) through `slate-50` to white. In dark mode, swap to `emerald-900/20 → slate-900 → slate-900`. The page itself is never flat white — it always carries the faint emerald tint.
- **Neutrals:** Slate scale (`slate-900` text, `slate-700` strong body, `slate-500` secondary, `slate-400` tertiary, `slate-200` borders, `slate-100` chip fills, `slate-50` faint fills). Dark mode mirrors with `slate-800` glass and `slate-100` text.
- **Semantic:** Red `#EF4444` (high priority, urgent timer chips), Yellow `#EAB308` (medium priority, leaderboard #1 avatar), Emerald `#10B981` (low priority, success, growth deltas), Orange `#F97316` (Hot Lead trending icon). No blues except the Meta brand gradient (`#0668E1 → #00C6FF`) on the third-party logo.

### Typography
- **Family:** **Montserrat** is the *only* family, loaded across 100–900 weights, ital + roman.
- **Weight rhythm.** Black (900) for hero numerals and card headers — this is the "Deha look". Bold (700) for buttons and small labels. Semibold (600) for nav chips and helper text. Medium (500) for body. Regular (400) almost never.
- **Tracking.** Tight tracking on the page title (`tracking-tight`), wide tracking on UPPERCASE micro-labels (`tracking-wider` / `tracking-widest`).
- **Scale.** 36–42px black numerals; 28px page title; 16px card titles; 14px body; 12–13px chip labels; 11px micro / table headers; 10px legend. Line-height tight on numerals (`leading-none`), snug on body (`leading-snug` / `leading-relaxed` only on long paragraphs).

### Spacing
- **Page padding:** 16px on the outside (`px-4`).
- **Card padding:** 20–24px (`p-5` / `p-6`).
- **Card-to-card gap:** 24px (`gap-6`).
- **Chip padding:** 12px × 6px (`px-3 py-1.5`).
- **Grid system:** A loose 4-point grid for component internals (4, 8, 12, 16, 20, 24, 32).

### Radius
- **Cards (hero / chart / large surfaces):** 24px (`rounded-[24px]`).
- **Cards (metric / leaderboard):** 20px (`rounded-[20px]`).
- **Buttons & internal cards:** 16px (`rounded-2xl`).
- **Pills, chips, tags:** Full (`rounded-full`).
- **Tiny chips:** 8px (`rounded-lg`).

### Backgrounds
- Page: radial gradient (emerald-tinted), never flat.
- Hero / accent cards: solid emerald `#10B981` with an overlaid white-to-transparent diagonal sheen (`bg-gradient-to-br from-white/20 to-transparent`) and a soft white blur orb in the top-right corner. Optionally overlaid with a subtle 20px grid (`grid-bg`).
- Neutral cards: white at 70% opacity (`bg-white/70`) with `backdrop-filter: blur(40px)` — this is the glass treatment.

### Glass / Blur
- Two blur strengths: `backdrop-blur-glass` (20px) for small chrome (the date selector pill, the sticky header), `backdrop-blur-strong` (40px) for full cards.
- Always paired with a half-opaque white fill (`white/70`) and a white border (`border-white/60`).
- Inside emerald cards, glass is achieved with `bg-white/10` + `bg-white/20` and a `border-white/20` — never repeat the page's blur stack inside an accent card.

### Shadows
The token set has **four** shadows and they are used precisely:
- `shadow-glass` — outer 4/6 + 2/4 drop shadow + a 1px white inset highlight at the top. The default for any white glass card.
- `shadow-glass-dark` — same shape, deeper blacks, dimmer inset. Default for any dark-mode glass card.
- `shadow-glass-sm` — 1px hairline + tiny inset. For small chips and pills.
- `shadow-recessed` — `inset 0 2px 4px rgba(0,0,0,0.06)`. For pressed surfaces — segmented controls, progress-bar tracks, slider tracks.
- One bespoke shadow appears on emerald hero cards: `0 10px 40px -10px rgba(16,185,129,0.5)` — an emerald-tinted ambient glow that grounds the card.

### Borders
Always **hairline** (1px) and almost always white-with-alpha: `border-white/60` on light glass, `border-white/10` on dark glass, `border-white/20` or `border-white/30` inside accent cards. Solid neutral borders (`border-slate-200`) appear only on inactive segmented-control buttons.

### Animation
- The supplied code has minimal animation: `transition-colors` on hover for buttons and rows. That's it.
- The brand vibe (sparkles icon, leaderboards, "AI matched") *wants* delightful micro-motion. When adding new motion, prefer **soft eases** (`cubic-bezier(.22,1,.36,1)`), 200–300ms durations, no bounces. Use opacity + 2–4px translate; avoid scale on big surfaces.

### Hover & Press
- **Hover (rows):** background tint to `white/50` (light) or `slate-700/50` (dark), 150ms.
- **Hover (CTAs):** lighten emerald to `emerald-50` for inverted CTAs (white bg → emerald-50 bg). For emerald CTAs, no observed treatment — recommend `brightness(1.05)`.
- **Press:** No defined press state in the source. Recommend a 96–98% scale + slight inset shadow.

### Transparency & Blur — when to use
- White glass (`white/70` + 40px blur) for **content cards** that sit over the page gradient.
- Black overlay (`bg-black/20` or `/30`) inside emerald cards for **embedded chips** (timers, progress-track) to keep contrast without breaking the brand color.
- Inner sheen (`from-white/20 to-transparent`) on **any saturated emerald surface** — gives the "liquid" feel.

### Layout rules
- **Fixed elements.** The page is a single scroll column on mobile; no fixed nav in the source. (UI kit adds a bottom nav, flagged as a system-standard addition.)
- **Max content width.** Mobile-first (390–430px effective). No desktop breakpoint defined.
- **Vertical rhythm.** Sections separated by 24px gap. Inside a card, headers carry 16–24px bottom margin.

### Imagery
No photographic imagery in the source. The system is purely chromatic + iconographic. When imagery is added, prefer **bright, daylight, warm-but-clean** photography (real estate, hotel rooms, healthcare facilities) — never cool-blue stock. Apply a 20px corner radius and a faint emerald-tinted overlay if compositing over a hero card.

### Charts
- Always **emerald**, never multicolor.
- Area fills use a vertical gradient `emerald-500 @ 0.5 → emerald-500 @ 0`.
- Lines are 2–3px, round caps. Hero charts add a subtle white-to-emerald gradient stroke (`#6EE7B7 → #ffffff → #34D399`) for "liquid" feel.
- Mini sparklines on metric cards: 100×40 viewBox, `preserveAspectRatio="none"`.

## Iconography

Deha uses **Google Material Icons** and **Material Symbols Outlined** exclusively. Both are loaded from Google's CDN:

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

Usage rules observed in the source:

- **`<span class="material-icons">name</span>`** for filled, classic-style icons (`expand_more`, `auto_awesome`, `arrow_forward`, `trending_up`, `emoji_events`, `leaderboard`, `check`, `schedule`, `filter_list`).
- **`<span class="material-symbols-outlined">name</span>`** for outlined variants used inline with text labels (`group`, `how_to_reg`, `payments`, `bar_chart`, `assignment`, `business_center`).
- Sizes are set inline as Tailwind utilities: `text-[12px]` through `text-[28px]`. The most common sizes are 14, 16, 18, 24, 28.
- Color is inherited via Tailwind `text-*` classes. Emerald (`text-primary`), slate, white, and the four semantic colors are all valid.
- **No emoji.** Never used.
- **No unicode glyphs.** The only non-icon symbol characters are `$`, `₺`, and `%`, used as typographic chars in numbers.
- **Brand SVGs.** Two third-party logos appear inline as SVG: Meta (blue→cyan gradient) and WhatsApp (`#25D366`). When recreating, copy the SVG paths verbatim.

If you need an icon that Material doesn't carry, **prefer Material Symbols' less-common glyphs** before reaching for another library. If you must use a different library, document it and flag the substitution to the user.

## Substitutions flagged
- **Logo / wordmark:** No logo file was provided. The system uses a temporary wordmark — "Deha" set in Montserrat Black with an emerald sparkle (`auto_awesome`) — until the real mark is supplied. **Please send the logo files.**
- **Photography:** No imagery was supplied; placeholders only.
- **Real-estate / vertical iconography:** None supplied. Material Symbols is used as a reasonable default.
