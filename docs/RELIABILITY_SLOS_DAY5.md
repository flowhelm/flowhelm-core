# Reliability SLOs — Day 5

Status: Implemented

## SLO Categories

### 1) Comms Delivery SLO
- Target: >= 99% successful scheduled status/alert deliveries per 24h window.
- Alert threshold: < 95% for 2 consecutive windows.

### 2) Duplicate Output SLO
- Target: <= 1 duplicate status post per topic per 24h window.
- Alert threshold: > 3 duplicates/day on any single stream.

### 3) Scheduler Health SLO
- Target: 0 overlapping canonical jobs per topic.
- Alert threshold: any detected overlap.

### 4) Recovery Time Objective (RTO)
- P1: stabilization within 15 minutes.
- P2: stabilization within 60 minutes.
- P3: stabilization within next business cycle.

### 5) Handoff Quality SLO
- Target: >= 95% delegated tasks pass quality gate first submission.
- Alert threshold: < 85% weekly pass rate.

## Measurement cadence
- Daily health summary (automation channels)
- Weekly reliability review (owner-led)
- Monthly trend review + threshold tuning

## Data required for SLO measurement
- Delivery success/failure counts
- Duplicate message detection counts
- Active scheduler inventory + overlap scan
- Incident durations by severity
- Delegation quality-gate pass/fail counts

## SLO breach response
1. Trigger incident owner assignment.
2. Enable circuit-breaker for noisy streams.
3. Apply corrective fix and verify.
4. Record prevention action in weekly review.
