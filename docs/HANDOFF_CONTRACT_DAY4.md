# Handoff Contract — Day 4

Status: Implemented

## Required fields for every delegated task

1. Objective (single-task)
2. Scope boundaries (in/out)
3. Allowed tools/actions
4. Input context bundle (minimal)
5. Expected output schema
6. Timeout + retry policy
7. Escalation condition
8. Rollback note (for state-changing work)

## Delegation template

```text
Task: <single objective>
Scope: <what to change> / Out-of-scope: <what not to change>
Tools allowed: <list>
Context: <only required files/ids/links>
Output format: <checklist|diff summary|commit+verification>
Timeout: <minutes>
Escalate if: <specific blocker>
Rollback: <how to undo>
```

## Anti-patterns (blocked)

- Compound goals in one delegation
- Unbounded tool use
- Missing rollback path for risky changes
- Delivering output without verification evidence
