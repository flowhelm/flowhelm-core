# Flowhelm Beta Channel Policy (to avoid cross-collab issues)

Channel: `#flowhelm-beta-test`
Purpose: collaborative chat between Dan, Morpheus (orchestrator), and Flowhelm execution lane.

## Operating model

1. **Single primary speaker policy**
   - Morpheus (orchestrator) is the default responder in this channel.
   - Flowhelm lane responses are relayed through Morpheus unless explicitly requested as direct lane output.

2. **One writer per recurring topic**
   - For status/health updates, only one scheduled job owns posting.
   - No duplicate status jobs for the same topic.

3. **One delivery mode per job**
   - Each automated job uses either:
     - announce-only, or
     - explicit message send
   - Never both for the same job.

4. **Task prefix routing**
   - `[ORCH]` = orchestration/planning decision
   - `[FLOWHELM]` = direct Flowhelm lane execution request
   - If no prefix, default route is orchestrator.

5. **Quality gate before delivery**
   - Implementation results are validated before user-facing summary.

6. **Failure circuit breaker**
   - If repeated post failures happen, auto-disable noisy duplicate jobs and escalate once.

## Setup checklist

- [x] Channel resolved and allowlisted in OpenClaw config.
- [ ] Optional: bind dedicated direct mode routing when platform support is available for Slack channel-agent mapping.
- [ ] Add one canonical recurring status job (if needed).

## Notes

Slack currently uses one bot identity in-channel; “both agents” is implemented as orchestrator + delegated lane execution, not two separate visible bot accounts by default.
