---
summary: "CLI reference for `flowhelm agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `flowhelm agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
flowhelm agents list
flowhelm agents add work --workspace ~/.flowhelm/workspace-work
flowhelm agents set-identity --workspace ~/.flowhelm/workspace --from-identity
flowhelm agents set-identity --agent main --avatar avatars/flowhelm.png
flowhelm agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.flowhelm/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
flowhelm agents set-identity --workspace ~/.flowhelm/workspace --from-identity
```

Override fields explicitly:

```bash
flowhelm agents set-identity --agent main --name "FlowHelm" --emoji "🦞" --avatar avatars/flowhelm.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "FlowHelm",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/flowhelm.png",
        },
      },
    ],
  },
}
```
