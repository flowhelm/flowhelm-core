import { abortEmbeddedPiRun } from "../../agents/pi-embedded.js";
import { parseDurationMs } from "../../cli/parse-duration.js";
import { isRestartEnabled } from "../../config/commands.js";
import type { SessionEntry } from "../../config/sessions.js";
import { updateSessionStore } from "../../config/sessions.js";
import { logVerbose } from "../../globals.js";
import { createInternalHookEvent, triggerInternalHook } from "../../hooks/internal-hooks.js";
import { scheduleGatewaySigusr1Restart, triggerOpenClawRestart } from "../../infra/restart.js";
import { loadCostUsageSummary, loadSessionCostSummary } from "../../infra/session-cost-usage.js";
import { formatTokenCount, formatUsd } from "../../utils/usage-format.js";
import { parseActivationCommand } from "../group-activation.js";
import { parseSendPolicyCommand } from "../send-policy.js";
import { normalizeUsageDisplay, resolveResponseUsageMode } from "../thinking.js";
import {
  formatAbortReplyText,
  isAbortTrigger,
  resolveSessionEntryForKey,
  setAbortMemory,
  stopSubagentsForRequester,
} from "./abort.js";
import type { CommandHandler } from "./commands-types.js";
import { clearSessionQueues } from "./queue.js";

function resolveAbortTarget(params: {
  ctx: { CommandTargetSessionKey?: string | null };
  sessionKey?: string;
  sessionEntry?: SessionEntry;
  sessionStore?: Record<string, SessionEntry>;
}) {
  const targetSessionKey = params.ctx.CommandTargetSessionKey?.trim() || params.sessionKey;
  const { entry, key } = resolveSessionEntryForKey(params.sessionStore, targetSessionKey);
  if (entry && key) {
    return { entry, key, sessionId: entry.sessionId };
  }
  if (params.sessionEntry && params.sessionKey) {
    return {
      entry: params.sessionEntry,
      key: params.sessionKey,
      sessionId: params.sessionEntry.sessionId,
    };
  }
  return { entry: undefined, key: targetSessionKey, sessionId: undefined };
}

async function applyAbortTarget(params: {
  abortTarget: ReturnType<typeof resolveAbortTarget>;
  sessionStore?: Record<string, SessionEntry>;
  storePath?: string;
  abortKey?: string;
}) {
  const { abortTarget } = params;
  if (abortTarget.sessionId) {
    abortEmbeddedPiRun(abortTarget.sessionId);
  }
  if (abortTarget.entry && params.sessionStore && abortTarget.key) {
    abortTarget.entry.abortedLastRun = true;
    abortTarget.entry.updatedAt = Date.now();
    params.sessionStore[abortTarget.key] = abortTarget.entry;
    if (params.storePath) {
      await updateSessionStore(params.storePath, (store) => {
        store[abortTarget.key] = abortTarget.entry!;
      });
    }
  } else if (params.abortKey) {
    setAbortMemory(params.abortKey, true);
  }
}

const SESSION_COMMAND_PREFIX = "/session";
const SESSION_TTL_OFF_VALUES = new Set(["off", "disable", "disabled", "none", "0"]);

export const handleSessionCommand: CommandHandler = async (params, allowTextCommands) => {
  if (!allowTextCommands) {
    return null;
  }
  const normalized = params.command.commandBodyNormalized;
  if (!/^\/session(?:\s|$)/.test(normalized)) {
    return null;
  }
  if (!params.command.isAuthorizedSender) {
    logVerbose(
      `Ignoring /session from unauthorized sender: ${params.command.senderId || "<unknown>"}`,
    );
    return { shouldContinue: false };
  }

  return {
    shouldContinue: false,
    reply: { text: "⚠️ /session ttl is currently unavailable for non-Discord sessions." },
  };
};

export const handleRestartCommand: CommandHandler = async (params, allowTextCommands) => {
  if (!allowTextCommands) {
    return null;
  }
  if (params.command.commandBodyNormalized !== "/restart") {
    return null;
  }
  if (!params.command.isAuthorizedSender) {
    logVerbose(
      `Ignoring /restart from unauthorized sender: ${params.command.senderId || "<unknown>"}`,
    );
    return { shouldContinue: false };
  }
  if (!isRestartEnabled(params.cfg)) {
    return {
      shouldContinue: false,
      reply: {
        text: "⚠️ /restart is disabled (commands.restart=false).",
      },
    };
  }
  const hasSigusr1Listener = process.listenerCount("SIGUSR1") > 0;
  if (hasSigusr1Listener) {
    scheduleGatewaySigusr1Restart({ reason: "/restart" });
    return {
      shouldContinue: false,
      reply: {
        text: "⚙️ Restarting OpenClaw in-process (SIGUSR1); back in a few seconds.",
      },
    };
  }
  const restartMethod = triggerOpenClawRestart();
  if (!restartMethod.ok) {
    const detail = restartMethod.detail ? ` Details: ${restartMethod.detail}` : "";
    return {
      shouldContinue: false,
      reply: {
        text: `⚠️ Restart failed (${restartMethod.method}).${detail}`,
      },
    };
  }
  return {
    shouldContinue: false,
    reply: {
      text: `⚙️ Restarting OpenClaw via ${restartMethod.method}; give me a few seconds to come back online.`,
    },
  };
};

export const handleStopCommand: CommandHandler = async (params, allowTextCommands) => {
  if (!allowTextCommands) {
    return null;
  }
  if (params.command.commandBodyNormalized !== "/stop") {
    return null;
  }
  if (!params.command.isAuthorizedSender) {
    logVerbose(
      `Ignoring /stop from unauthorized sender: ${params.command.senderId || "<unknown>"}`,
    );
    return { shouldContinue: false };
  }
  const abortTarget = resolveAbortTarget({
    ctx: params.ctx,
    sessionKey: params.sessionKey,
    sessionEntry: params.sessionEntry,
    sessionStore: params.sessionStore,
  });
  const cleared = clearSessionQueues([abortTarget.key, abortTarget.sessionId]);
  if (cleared.followupCleared > 0 || cleared.laneCleared > 0) {
    logVerbose(
      `stop: cleared followups=${cleared.followupCleared} lane=${cleared.laneCleared} keys=${cleared.keys.join(",")}`,
    );
  }
  await applyAbortTarget({
    abortTarget,
    sessionStore: params.sessionStore,
    storePath: params.storePath,
    abortKey: params.command.abortKey,
  });

  // Trigger internal hook for stop command
  const hookEvent = createInternalHookEvent(
    "command",
    "stop",
    abortTarget.key ?? params.sessionKey ?? "",
    {
      sessionEntry: abortTarget.entry ?? params.sessionEntry,
      sessionId: abortTarget.sessionId,
      commandSource: params.command.surface,
      senderId: params.command.senderId,
    },
  );
  await triggerInternalHook(hookEvent);

  const { stopped } = stopSubagentsForRequester({
    cfg: params.cfg,
    requesterSessionKey: abortTarget.key ?? params.sessionKey,
  });

  return { shouldContinue: false, reply: { text: formatAbortReplyText(stopped) } };
};

export const handleAbortTrigger: CommandHandler = async (params, allowTextCommands) => {
  if (!allowTextCommands) {
    return null;
  }
  if (!isAbortTrigger(params.command.rawBodyNormalized)) {
    return null;
  }
  const abortTarget = resolveAbortTarget({
    ctx: params.ctx,
    sessionKey: params.sessionKey,
    sessionEntry: params.sessionEntry,
    sessionStore: params.sessionStore,
  });
  await applyAbortTarget({
    abortTarget,
    sessionStore: params.sessionStore,
    storePath: params.storePath,
    abortKey: params.command.abortKey,
  });
  return { shouldContinue: false, reply: { text: "⚙️ Agent was aborted." } };
};
