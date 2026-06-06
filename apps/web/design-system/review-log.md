# Design System — Component Review Log

Per `CONVERSION-SOP.md`, every converted component is reviewed by Bora over the
SSH tunnel with the Agentation toolbar, then logged here with the outcome.

---

## leads-table — pilot (Step 7 of design-system-pipeline)

- **Source:** `apps/web/design-system/preview/components-leads-table.html` (+ `_leads-table.css`, `_leads-table-data.js`, `_leads-table-render.js`, `_lead-popover.jsx`, `_lead-popover.css`, `_lead-metrics.js`)
- **React port:** `apps/web/src/components/design-system/leads-table/` (`LeadsTable.tsx`, `LeadPopover.tsx`, `leadsData.ts`, `leadMetrics.ts`, `popover-hook.ts`)
- **Route:** `/leads` (linked from the showcase index)
- **Built:** 2026-06-06. Build clean, lint clean, zero raw useEffect in components, no mobile deps. 16 leads ported verbatim.
- **Behaviors ported:** column sort (AI Score / Value / Sentiment / Last Contact), search, three quick filters (hot / high-value / earn-today) + clear + result count, row density toggle, column-config button (toast placeholder, matches source), view-more expansion + pagination footer, CSV export, toast, lead-details popover (schema + tier driven: pulse / behavior / qualification / deep-NLP / risk tiers, all viz primitives, AI tools chat, cold-drop countdown), Esc-close, per-lead reset.
- **Known carry-overs from source (not added/changed):** workspace switcher UI is not in the source popover, so `ws` is fixed to `real_estate`; column-config shows a "coming soon" toast exactly as the prototype does.

### Review status: APPROVED (2026-06-06)

Bora reviewed the leads-table at `http://localhost:5173/leads` over the SSH tunnel with the Agentation toolbar and confirmed it looks correct ("okay looks fine").

- **Annotations received:** none (no design changes requested at this time)
- **Fixes applied:** none
- **Approval:** APPROVED by Bora, 2026-06-06. Pilot closed. Design feedback, if any, will be handled later via the known-issues workflow (`waves/ui-library-known-issues-workflow.md`).
