# src/hooks/

Cross-feature React hooks that are used by two or more feature folders (e.g., `useCurrentUser`, `useDebounce`, `useToast`).
Hooks here must have no dependency on a single feature's internal types or state.
Do NOT put hooks that are only used within one feature — keep those inside `src/features/<feature>/hooks/`.
