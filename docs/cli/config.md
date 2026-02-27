---
summary: "CLI reference for `flowhelm config` (get/set/unset config values)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `flowhelm config`

Config helpers: get/set/unset values by path. Run without a subcommand to open
the configure wizard (same as `flowhelm configure`).

## Examples

```bash
flowhelm config get browser.executablePath
flowhelm config set browser.executablePath "/usr/bin/google-chrome"
flowhelm config set agents.defaults.heartbeat.every "2h"
flowhelm config set agents.list[0].tools.exec.node "node-id-or-name"
flowhelm config unset tools.web.search.apiKey
```

## Paths

Paths use dot or bracket notation:

```bash
flowhelm config get agents.defaults.workspace
flowhelm config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
flowhelm config get agents.list
flowhelm config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--strict-json` to require JSON5 parsing. `--json` remains supported as a legacy alias.

```bash
flowhelm config set agents.defaults.heartbeat.every "0m"
flowhelm config set gateway.port 19001 --strict-json
flowhelm config set channels.whatsapp.groups '["*"]' --strict-json
```

Restart the gateway after edits.
