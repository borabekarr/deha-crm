# src/features/

One subfolder per CRM surface (e.g., `contacts/`, `pipeline/`, `dashboard/`).
Each feature folder owns its own components, hooks, types, and local utilities — nothing is shared implicitly.
Cross-feature dependencies must go through `src/components/shared/`, `src/hooks/`, or `src/types/` instead.
Do NOT place generic UI primitives or global utilities here.
