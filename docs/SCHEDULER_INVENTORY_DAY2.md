# Scheduler Inventory — Day 2

Date: 2026-02-25
Status: Completed

## Scope checked

1. Primary OpenClaw gateway scheduler (orchestrator host)
2. Flowhelm server OpenClaw scheduler (`192.168.0.76`)
3. App-server host cron (`192.168.0.130`)

---

## Inventory results

### A) OpenClaw cron — orchestrator host
- Active jobs: **0**
- Overlap risk: **none**

### B) OpenClaw cron — Flowhelm server (`192.168.0.76`)
- Active jobs: **0**
- Overlap risk: **none**

### C) Host cron — app server (`192.168.0.130`)
Active jobs:
1. `0 21 * * 5 APP_DIR=/home/openclaw/optimaclaw /home/openclaw/optimaclaw/scripts/run_weekly_scorecard.sh`
   - Topic: weekly scorecard reporting
   - Owner: strategy/reporting lane
2. `0 14 * * 1-5 APP_DIR=/home/openclaw/optimaclaw /home/openclaw/optimaclaw/scripts/run_ops_preopen_check.sh`
   - Topic: pre-open health check
   - Owner: ops lane
3. `*/5 * * * * /home/openclaw/optimaclaw/scripts/health_watchdog.sh`
   - Topic: runtime health alerting
   - Owner: ops lane

---

## Overlap analysis

- No duplicate schedule owner for same topic.
- No mixed delivery path found for the same recurring topic in host cron.
- Topic ownership is now one-job-per-stream.

---

## Cleanup actions performed

1. Removed stale/legacy watchdog cron path:
   - old: `/home/dan/optimaclaw/scripts/health_watchdog.sh`
2. Replaced with canonical path:
   - new: `/home/openclaw/optimaclaw/scripts/health_watchdog.sh`
3. Copied watchdog script to canonical app dir and updated root path.
4. Updated default alert channel in watchdog script to ops alerts channel:
   - `C0AH35NR99Q`

---

## Day 2 exit criteria

- [x] Scheduler inventory documented
- [x] Topic ownership mapped
- [x] Overlap risk reduced/removed
- [x] Canonical paths enforced for host cron jobs

---

## Next (Day 3)

Implement explicit delivery-mode guardrails + preflight validation checklist for every active recurring job.
