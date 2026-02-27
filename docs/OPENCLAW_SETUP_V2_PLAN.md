# OpenClaw Setup v2 Plan (7-Day Execution)

Status: Draft + execution-ready
Owner: Dan (approval), Morpheus (execution)

## Objective

Increase reliability and reduce coordination friction by enforcing clear control/execution boundaries, scheduler discipline, and channel policy.

## Target State

- 3-channel operating model (control, execution, alerts)
- single-writer scheduler policy
- delivery-mode guardrail (announce OR explicit send)
- channel policies documented + pinned
- weekly reliability review ritual

---

## Day 1 — Control Plane Hardening

1. Confirm channel roles:
   - control channel (orchestrator-only)
   - execution channel (implementation lane)
   - alerts channel (automation output)
2. Add/validate channel allowlists.
3. Document and pin channel policy for each active channel.

Deliverables:

- `CHANNEL_POLICY.md` per active lane
- pinned policy messages in channels

---

## Day 2 — Scheduler Cleanup

1. Inventory all active cron jobs.
2. Group jobs by output topic/channel.
3. Remove/disable overlaps.
4. Assign one canonical job owner per topic.

Deliverables:

- `SCHEDULER_INVENTORY.md`
- overlap-free cron set

---

## Day 3 — Delivery Guardrails

1. Enforce one delivery mode per job.
2. Add preflight checks:
   - supported model
   - reachable channel target
   - duplicate-job detection
3. Add failure circuit breaker (auto-disable noisy duplicate jobs after threshold).

Deliverables:

- `SCHEDULER_POLICY.md`
- guardrail checklist applied to all active jobs

---

## Day 4 — Handoff Quality Gate

1. Standardize delegated task contract:
   - objective, scope, tools, timeout, expected output
2. Enforce orchestrator quality gate before user delivery.
3. Add rollback/remediation requirement for high-impact changes.

Deliverables:

- `HANDOFF_CONTRACT.md`
- quality gate checklist in workflow

---

## Day 5 — Observability + Incident Discipline

1. Add structured incident log template.
2. Define reliability SLOs:
   - post success SLA
   - duplicate output rate threshold
   - unresolved failure streak threshold
3. Add one-page incident response playbook.

Deliverables:

- `INCIDENT_PLAYBOOK.md`
- `RELIABILITY_SLOS.md`

---

## Day 6 — Documentation Consolidation

1. Create `OPERATING_MODEL.md`.
2. Cross-link all policy docs.
3. Add “first 5 minutes” troubleshooting section.

Deliverables:

- docs index for operations
- clean onboarding path for future maintainers

---

## Day 7 — Reliability Review Ritual

1. Run 30-minute review:
   - failed jobs
   - duplicate messages
   - handoff misses
   - policy exceptions
2. Produce weekly corrective actions.
3. Schedule next review cadence.

Deliverables:

- `WEEKLY_RELIABILITY_REVIEW.md` (first run)

---

## Execution Rules

- No new automation job without owner + channel + delivery mode.
- No multi-owner status streams.
- No compound delegated tasks.
- All high-impact changes must include rollback note.

## Success Criteria

- Zero duplicate status posts from overlapping jobs.
- No unresolved cron misconfigurations in active lanes.
- < 1 follow-up prompt needed for status updates during active execution windows.
