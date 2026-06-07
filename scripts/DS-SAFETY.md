# Design System Safety Model

## Overview

This document explains how component source is protected, recovered, and verified across the
design-system library build process.

---

## Source of Truth

Each component lives in its own self-contained folder:

```
apps/web/src/components/design-system/<slug>/
```

The library site imports from these folders. The folders are the only authoritative copy of
each component's React source.

**Git is the primary safe place.** Commit and push every component immediately after it passes
local verification. A remote commit is the strongest guarantee against accidental loss.

---

## The Archive Layer

`design-system-archive/` is an independent, git-tracked copy of each component's files.
It is written by `scripts/ds-archive.sh` and by nothing else. Never hand-edit files inside it.

Structure per component:

```
design-system-archive/<slug>/
  react/    — copy of apps/web/src/components/design-system/<slug>/
  source/   — original HTML prototype + every _* asset it references
```

Because this directory is git-tracked (not gitignored), it persists across branch switches,
rebases, and partial checkouts, giving a secondary recovery path that is independent of the
working tree.

### When to archive

Run `scripts/ds-archive.sh <slug>` after committing a component and before starting any
destructive refactor, rename, or directory restructure that touches that component.

---

## Restore Procedure

If a component folder is missing or corrupted, restore from the archive:

```bash
scripts/ds-restore.sh <slug>
```

The script exits non-zero with a clear error message if no archive entry exists for that slug.
After restoring, verify the component renders correctly in the dev server, then commit the
restored files.

---

## Static Snapshot

`scripts/library-snapshot.sh` builds the web app and copies `apps/web/dist/` to
`design-system-dist/`. This directory is gitignored because it is a build artifact; it is not
a backup. Its purpose is to give a working static site that survives a dev-server crash or
local port conflict.

Serve the snapshot:

```bash
npx serve design-system-dist
```

Do not treat the snapshot as source. If the snapshot and the source folders disagree, the
source folders are correct.

---

## The Running Dev Server is Not the Source

The localhost preview at any port is a view over the source files. Refreshing, closing, or
losing the terminal window does not destroy any component. The source files on disk are what
matter. Do not copy-paste code from the browser dev-tools back into the source files; always
edit the source files directly.

---

## Quick Reference

| Action | Command |
|---|---|
| Archive a component | `scripts/ds-archive.sh <slug>` |
| Restore a component | `scripts/ds-restore.sh <slug>` |
| Build static snapshot | `scripts/library-snapshot.sh` |
| Serve static snapshot | `npx serve design-system-dist` |
