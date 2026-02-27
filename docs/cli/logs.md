---
summary: "CLI reference for `flowhelm logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `flowhelm logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
flowhelm logs
flowhelm logs --follow
flowhelm logs --json
flowhelm logs --limit 500
flowhelm logs --local-time
flowhelm logs --follow --local-time
```

Use `--local-time` to render timestamps in your local timezone.
