# Channel Policy — ops-alerts (Automation Alerts)

Purpose: low-noise operational alerts + health summaries.

Rules:

- Human discussion minimized; thread responses preferred.
- Single canonical scheduler per alert topic.
- Circuit-breaker behavior required for repeated failures.

Automation:

- Only status/alerts and remediation hints.
- No duplicate jobs for same stream.
