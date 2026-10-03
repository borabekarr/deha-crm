# Deha Design System (Bora)

Tokens live in `styles.css` → `colors_and_type.css`. Every component page lives in `components/<category>/<page>/`. Pages built from several parts open with an `index.html` that stacks each part as a section; open a part directly for its full demo.

Shared support files (base styles, dark mode, color mode, slow-mo, motion tokens, tweaks panel, iOS frame) live in `components/_shared/`.

## 01 · Foundations
Tokens and the base pieces nearly every component uses.

| Page | Path | Parts |
|---|---|---|
| Colors | `components/01-foundations/colors/` | Primary, Neutrals, Semantic |
| Typography | `components/01-foundations/typography/` | Type Scale, Type Display |
| Text Highlight | `components/01-foundations/text-highlight/` | Highlighted Text, TextHighlighter |
| Spacing & Elevation | `components/01-foundations/spacing-elevation/` | Spacing Scale, Radii, Shadows |
| Iconography | `components/01-foundations/iconography/` | Material icon glyph set |
| Backgrounds | `components/01-foundations/backgrounds/` | Background Gradient |
| Buttons | `components/01-foundations/buttons/` | Buttons, Book a Call (+ BookACallButton), Save Toggle (+ SaveToggle, SaveToggleOriginal), Family Receive, FAB |
| Pills & Badges | `components/01-foundations/pills-badges/` | Capsule Pills and Cards, Notification Badge, Kbd, Shiny Badge, Shiny Pill, Glowing Badge |
| Cards | `components/01-foundations/cards/` | MainBox, Image Card, CardWithImage, OfferBox, 3D Holo Card |

## 02 · Inputs & Controls
| Page | Path | Parts |
|---|---|---|
| Controls | `components/02-inputs-controls/controls/` | Toggle, segmented, slider track; Slider |
| Inline Edit | `components/02-inputs-controls/inline-edit/` | Click-to-edit field |
| Progressive Input Stack | `components/02-inputs-controls/progressive-input-stack/` | |
| Password Meter | `components/02-inputs-controls/password-meter/` | |
| Discrete Tabs | `components/02-inputs-controls/discrete-tabs/` | |
| Accordion | `components/02-inputs-controls/accordion/` | |
| Calendar Booking | `components/02-inputs-controls/calendar-booking/` | |
| Scrollbar | `components/02-inputs-controls/scrollbar/` | |
| Multisteps | `components/02-inputs-controls/multisteps/` | Styles only, no demo card yet |

## 03 · Data Display
| Page | Path | Parts |
|---|---|---|
| Table | `components/03-data-display/table/` | |
| File Tree | `components/03-data-display/file-tree/` | |
| List Row Nav | `components/03-data-display/list-row-nav/` | |
| Lists | `components/03-data-display/lists/` | Stacked List, Pinned List, Animated List |
| Metrics | `components/03-data-display/metrics/` | Metric Card, Metric Circle |
| Pipeline Card | `components/03-data-display/pipeline-card/` | |
| News Feed | `components/03-data-display/news-feed/` | |
| Blur Carousel | `components/03-data-display/blur-carousel/` | |

## 04 · Overlays & Popovers
| Page | Path | Parts |
|---|---|---|
| Dialogs | `components/04-overlays/dialogs/` | Modal open/close, AlertDialog |
| Tooltips | `components/04-overlays/tooltips/` | Tooltip open/close, TipPopover |
| Menus | `components/04-overlays/menus/` | Menu Dropdown, ContextMenu, Message Dropdown |
| Sheets & Drawers | `components/04-overlays/sheets/` | ActionSheet, Drawer |
| Promo Popovers | `components/04-overlays/promo-popovers/` | NewFeaturePopover, PopoverOfferCold |
| Show QR | `components/04-overlays/show-qr/` | |

## 05 · Navigation & Layout
| Page | Path | Parts |
|---|---|---|
| Navigation | `components/05-navigation-layout/navigation/` | |
| Side Panes | `components/05-navigation-layout/side-panes/` | Left Side Pane, Give Feedback Pane |
| Bottom Toolbar | `components/05-navigation-layout/bottom-toolbar/` | |
| Top Banner | `components/05-navigation-layout/top-banner/` | |
| Animated Header Scroll | `components/05-navigation-layout/animated-header-scroll/` | |
| Dynamic Island Reader | `components/05-navigation-layout/dynamic-island-reader/` | |

## 06 · AI Chat
| Page | Path | Parts |
|---|---|---|
| Messages | `components/06-ai-chat/messages/` | AI Chat Message, MessageBubble, AiMessageBoxGeneral, AiMessageBox2, AI Caveat |
| Composer | `components/06-ai-chat/composer/` | MessageComposer, Queue Input, Chatbox and Suggestions, Anonymous |
| Thinking | `components/06-ai-chat/thinking/` | Reasoning, Chain of Thought, Text Shimmer, Typing Animation |
| Plans & Tasks | `components/06-ai-chat/plans-tasks/` | Plan, Action Plan, Task, Checkpoint |
| Human in the Loop | `components/06-ai-chat/human-in-the-loop/` | Confirmation, Ask User Questions, Feedback Bar |
| Context & Sources | `components/06-ai-chat/context-sources/` | Context (+ ContextRing), Inline Citation (+ CitationChip), Attachments (+ AttachmentCard) |

## 07 · Animations
| Page | Path | Parts |
|---|---|---|
| Number Flow | `components/07-animations/number-flow/` | |
| Slide Up Text | `components/07-animations/slide-up-text/` | |
| Page Transitions | `components/07-animations/page-transitions/` | Side by Side, Panel Reveal |
| Phone Scroll | `components/07-animations/phone-scroll/` | |
| Receipt Printer | `components/07-animations/receipt-printer/` | |
| Interactive Dot Grid | `components/07-animations/interactive-dot-grid/` | |
| Shimmer Skeleton | `components/07-animations/shimmer-skeleton/` | |

Motion tokens: `components/_shared/_motion-tokens.css`.

## 08 · Rewards & Gamification
| Page | Path |
|---|---|
| Streak Card | `components/08-rewards/streak-card/` |
| Prize Sheet | `components/08-rewards/prize-sheet/` |

## 09 · Marketing & Pricing
| Page | Path | Parts |
|---|---|---|
| Pricing | `components/09-marketing-pricing/pricing/` | Pricing, Pricing Slider |
| Payments Free Trial | `components/09-marketing-pricing/payments-free-trial/` | |
| How It Works | `components/09-marketing-pricing/how-it-works/` | |
| Web Preview | `components/09-marketing-pricing/web-preview/` | |
| Hero Banner | `components/09-marketing-pricing/hero-banner/` | |
| Auth Card | `components/09-marketing-pricing/auth-card/` | |

## Conventions
- New component → `components/<category>/<page>/`. Sub-components a page imports (e.g. `BookACallButton.dc.html`) sit next to it and carry no card of their own.
- Shared CSS/JS → `components/_shared/`. Category-level CSS (`_buttons.css`, `_pills.css`, `_cards.css`) stays with its Foundations page and is linked from elsewhere.
- `uploads/` holds the original raw files as an archive.
