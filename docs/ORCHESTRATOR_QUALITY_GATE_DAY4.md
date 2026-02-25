# Orchestrator Quality Gate — Day 4

Status: Implemented

Before delivering delegated output, orchestrator must verify all items below.

## Gate Checklist (must pass)
1. Scope match
   - Output satisfies requested objective only.
2. Evidence of execution
   - Commands/logs/tests/links provided.
3. Correctness check
   - No unresolved errors in provided evidence.
4. Policy compliance
   - Scheduler/channel/delivery-mode policies respected.
5. Risk & rollback
   - Rollback path exists for any state change.
6. User-facing clarity
   - Summary includes: what changed, where, status, next step.

## Fail behavior
- If any gate fails:
  1) do not deliver as complete,
  2) return to execution lane for correction,
  3) escalate only if blocked.

## Completion output format
```text
Status: <done|partial|blocked>
Changes: <files/systems>
Evidence: <checks/logs/run ids>
Risk: <low|med|high>
Rollback: <command/path>
Next: <single next action>
```
