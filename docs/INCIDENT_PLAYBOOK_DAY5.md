# Incident Playbook — Day 5

Status: Implemented

## Severity levels

- **P1**: Core service unavailable, cross-context leakage risk, repeated failed automation with user impact.
- **P2**: Major degradation, delayed processing, partial delivery failures.
- **P3**: Minor degradation, single-job issues without broad impact.

## Incident response flow

1. **Declare**
   - Open incident with title, start time (UTC), owner.
2. **Stabilize**
   - Stop noisy duplicate jobs.
   - Enforce single canonical writer per topic.
3. **Diagnose**
   - Capture logs, run IDs, failing job IDs, config diff.
4. **Contain**
   - Disable failing automation paths.
   - Fallback to manual or reduced-mode operation.
5. **Recover**
   - Apply fix, run verification checks, confirm healthy state.
6. **Close**
   - Record root cause, corrective action, prevention action.

## Required incident record fields

- Incident ID
- Severity
- Start/End UTC
- Affected channels/surfaces
- Trigger signal
- Root cause
- Fix applied
- Verification evidence
- Prevention actions

## First 5-minute actions checklist

- [ ] Assign incident owner
- [ ] Freeze duplicate schedulers for impacted stream
- [ ] Capture current cron/job inventory
- [ ] Pull latest error logs + failing run IDs
- [ ] Post concise status update in alerts channel

## Exit criteria

- [ ] User-facing impact stopped
- [ ] Single-writer behavior restored
- [ ] Verification checks green
- [ ] Follow-up prevention task logged
