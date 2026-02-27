# Channel Policy — flowhelm-beta-test (Execution Plane)

Purpose: implementation/test execution lane.

Rules:

- Default responder: orchestrator relaying execution-lane outcomes.
- One writer per recurring topic.
- One delivery mode per job (announce OR explicit send).
- Prefixes:
  - [FLOWHELM] direct execution request
  - [ORCH] request orchestration decision

Automation:

- Recurring execution/status updates allowed if single-owner policy is met.
