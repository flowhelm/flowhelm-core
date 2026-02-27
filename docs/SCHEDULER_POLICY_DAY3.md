# Scheduler Policy & Guardrails — Day 3

Date: 2026-02-25
Status: Implemented

## Objective

Enforce delivery-mode guardrails and preflight validation for recurring operational jobs.

## Implemented Controls

1. **Single delivery mode guardrail**
   - Supported modes: `explicit_send`, `none`
   - `announce` is explicitly rejected in host cron scripts to prevent mixed-mode duplication.

2. **Per-job overlap lock**
   - Added lockfile-based non-blocking guard (`flock`) per recurring job.
   - If another run is active, the next run exits safely.

3. **Preflight validation**
   - Required command checks (`docker`, `curl`, `uv`, etc.)
   - Slack target validation when delivery mode requires messaging
   - Basic channel ID format validation before posting

4. **Runtime compatibility hardening**
   - Compose command fallback support (`docker compose` or `docker-compose`)
   - Environment-file source failures downgraded to non-fatal (guarded)

5. **Canonical cron path integrity**
   - Recurring jobs aligned to one canonical app root and script path
   - Legacy duplicate path references removed

## Operational Notes

- Delivery mode defaults to `explicit_send`; set `DELIVERY_MODE=none` for dry-run/no-post behavior.
- Guardrails are implemented via shared helper script:
  - `scripts/cron_guardrails.sh`

## Verification Snapshot

- Pre-open check script: passes with `DELIVERY_MODE=none`
- Weekly scorecard script: passes with fallback report pathing when generator is absent
- Watchdog script: passes with guarded env loading and single-writer semantics

## Exit Criteria

- [x] Delivery mode policy enforced
- [x] Preflight checks implemented
- [x] Overlap lock enabled
- [x] Canonical execution path stabilized

## Next (Day 4)

Apply delegation handoff contract + orchestrator quality-gate standardization.
