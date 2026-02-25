# Operating Model — Day 6

Status: Implemented

## Objective
Provide a single, concise operational model that links control flow, execution flow, scheduler policy, incident handling, and quality gates.

## Core Model
1. **Control plane**
   - Intake, planning, approvals, escalation, and final user-facing delivery.
2. **Execution plane**
   - Bounded implementation and operational tasks under explicit task contracts.
3. **Alerts plane**
   - Low-noise status/incident signaling with single-writer ownership.

## Lifecycle of a request
1. Intake + classify (control plane)
2. Contracted delegation (if needed)
3. Execution + evidence capture
4. Quality gate verification
5. User-facing delivery
6. Memory + runbook update when significant

## Standards (must hold)
- One task per delegation
- One writer per recurring topic
- One delivery mode per automation job
- Rollback path for state-changing work
- Evidence-backed completion summaries

## First 5 minutes troubleshooting
1. Check scheduler ownership + overlap
2. Check latest failed job/run IDs
3. Check delivery-mode mismatch
4. Check channel reachability/auth
5. Trigger circuit breaker if noisy failures repeat

## Linked references
- `OPENCLAW_SETUP_V2_PLAN.md`
- `SCHEDULER_INVENTORY_DAY2.md`
- `SCHEDULER_POLICY_DAY3.md`
- `HANDOFF_CONTRACT_DAY4.md`
- `ORCHESTRATOR_QUALITY_GATE_DAY4.md`
- `INCIDENT_PLAYBOOK_DAY5.md`
- `RELIABILITY_SLOS_DAY5.md`
