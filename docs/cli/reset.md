---
summary: "CLI reference for `flowhelm reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `flowhelm reset`

Reset local config/state (keeps the CLI installed).

```bash
flowhelm reset
flowhelm reset --dry-run
flowhelm reset --scope config+creds+sessions --yes --non-interactive
```
