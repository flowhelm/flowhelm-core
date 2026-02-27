---
summary: "CLI reference for `flowhelm daemon` (legacy alias for gateway service management)"
read_when:
  - You still use `flowhelm daemon ...` in scripts
  - You need service lifecycle commands (install/start/stop/restart/status)
title: "daemon"
---

# `flowhelm daemon`

Legacy alias for Gateway service management commands.

`flowhelm daemon ...` maps to the same service control surface as `flowhelm gateway ...` service commands.

## Usage

```bash
flowhelm daemon status
flowhelm daemon install
flowhelm daemon start
flowhelm daemon stop
flowhelm daemon restart
flowhelm daemon uninstall
```

## Subcommands

- `status`: show service install state and probe Gateway health
- `install`: install service (`launchd`/`systemd`/`schtasks`)
- `uninstall`: remove service
- `start`: start service
- `stop`: stop service
- `restart`: restart service

## Common options

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- lifecycle (`uninstall|start|stop|restart`): `--json`

## Prefer

Use [`flowhelm gateway`](/cli/gateway) for current docs and examples.
