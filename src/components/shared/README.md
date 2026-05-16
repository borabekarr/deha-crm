# src/components/shared/

Non-feature components reused across two or more CRM surfaces (e.g., `<PageHeader>`, `<EmptyState>`, `<DataTable>`).
These may contain light CRM awareness (labels, icons) but no feature-specific business logic.
Do NOT put Shadcn primitives here (use `src/components/ui/`).
Do NOT put components that belong to a single feature (keep those inside `src/features/<feature>/`).
