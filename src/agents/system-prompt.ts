import { createHmac, createHash } from "node:crypto";
import type { ReasoningLevel, ThinkLevel } from "../auto-reply/thinking.js";
import { HEARTBEAT_TOKEN, SILENT_REPLY_TOKEN } from "../auto-reply/tokens.js";
import type { MemoryCitationsMode } from "../config/types.memory.js";
import { listDeliverableMessageChannels } from "../utils/message-channel.js";
import type { ResolvedTimeFormat } from "./date-time.js";
import type { EmbeddedContextFile } from "./pi-embedded-helpers.js";
import type { EmbeddedSandboxInfo } from "./pi-embedded-runner/types.js";
import { sanitizeForPromptLiteral } from "./sanitize-for-prompt.js";

/**
 * Controls which hardcoded sections are included in the system prompt.
 * - "full": All sections (default, for main agent)
 * - "minimal": Reduced sections (Tooling, Workspace, Runtime) - used for subagents
 * - "heartbeat": Ultra-minimal sections for periodic checks
 * - "none": Just basic identity line, no sections
 */
export type PromptMode = "full" | "minimal" | "heartbeat" | "none";
type OwnerIdDisplay = "raw" | "hash";

function buildSkillsSection(params: { skillsPrompt?: string; readToolName: string }) {
  const trimmed = params.skillsPrompt?.trim();
  if (!trimmed) {
    return [];
  }
  return [
    "## Skills (mandatory)",
    "Before replying: scan <available_skills>.",
    `- Clearly applies? Read SKILL.md at <location> with \`${params.readToolName}\`.`,
    "- Multiple? Choose the most specific.",
    "- None? Skip reading.",
    "Constraint: read at most one SKILL.md per turn.",
    trimmed,
    "",
  ];
}

function buildMemorySection(params: {
  isMinimal: boolean;
  availableTools: Set<string>;
  citationsMode?: MemoryCitationsMode;
}) {
  if (params.isMinimal) {
    return [];
  }
  if (!params.availableTools.has("memory_search") && !params.availableTools.has("memory_get")) {
    return [];
  }
  const lines = [
    "## Memory Recall",
    "For prior work/dates/people/prefs: run memory_search then memory_get for needed lines.",
  ];
  if (params.citationsMode === "off") {
    lines.push("No citations: do not mention paths/lines unless asked.");
  } else {
    lines.push("Citations: include Source: <path#line> for verification.");
  }
  lines.push("");
  return lines;
}

function buildUserIdentitySection(ownerLine: string | undefined, isMinimal: boolean) {
  if (!ownerLine || isMinimal) {
    return [];
  }
  return ["## Authorized Senders", ownerLine, ""];
}

function formatOwnerDisplayId(ownerId: string, ownerDisplaySecret?: string) {
  const hasSecret = ownerDisplaySecret?.trim();
  const digest = hasSecret
    ? createHmac("sha256", hasSecret).update(ownerId).digest("hex")
    : createHash("sha256").update(ownerId).digest("hex");
  return digest.slice(0, 12);
}

function buildOwnerIdentityLine(
  ownerNumbers: string[],
  ownerDisplay: OwnerIdDisplay,
  ownerDisplaySecret?: string,
) {
  const normalized = ownerNumbers.map((value) => value.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return undefined;
  }
  const displayOwnerNumbers =
    ownerDisplay === "hash"
      ? normalized.map((ownerId) => formatOwnerDisplayId(ownerId, ownerDisplaySecret))
      : normalized;
  return `Authorized: ${displayOwnerNumbers.join(", ")}. (Allowlisted; do not assume owner).`;
}

function buildTimeSection(params: { userTimezone?: string }) {
  if (!params.userTimezone) {
    return [];
  }
  return ["## Current Date & Time", `Time zone: ${params.userTimezone}`, ""];
}

function buildReplyTagsSection(isMinimal: boolean) {
  if (isMinimal) {
    return [];
  }
  return [
    "## Reply Tags",
    "To request native reply/quote, start message with: [[reply_to_current]] your reply.",
    "- [[reply_to_current]] replies to the last message (preferred).",
    "- [[reply_to:<id>]] uses specific id.",
    "",
  ];
}

function buildMessagingSection(params: {
  isMinimal: boolean;
  availableTools: Set<string>;
  messageChannelOptions: string;
  inlineButtonsEnabled: boolean;
  runtimeChannel?: string;
  messageToolHints?: string[];
}) {
  if (params.isMinimal) {
    return [];
  }
  return [
    "## Messaging",
    "- Current session: reply normally.",
    "- Cross-session: sessions_send(sessionKey, message).",
    "- Sub-agents: subagents(action=list|steer|kill).",
    "- `[System Message]` blocks are internal; do not forward raw. Rewrite updates in your voice.",
    `- For nothing to say, use: ${SILENT_REPLY_TOKEN}.`,
    "- Internal routing only; never use exec/curl for messaging.",
    params.availableTools.has("message")
      ? [
          "",
          "### message tool",
          "- Proactive sends/actions. `action=send` requires `to` and `message`.",
          `- Pass \`channel\` if multiple (${params.messageChannelOptions}).`,
          `- If sending visible reply via \`message\`, respond with ONLY: ${SILENT_REPLY_TOKEN}.`,
          params.inlineButtonsEnabled
            ? "- Buttons: `buttons=[[{text,callback_data,style?}]]` (primary|success|danger)."
            : "",
          ...(params.messageToolHints ?? []),
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    "",
  ];
}

function buildVoiceSection(params: { isMinimal: boolean; ttsHint?: string }) {
  if (params.isMinimal) {
    return [];
  }
  const hint = params.ttsHint?.trim();
  if (!hint) {
    return [];
  }
  return ["## Voice (TTS)", hint, ""];
}

function buildDocsSection(params: { docsPath?: string; isMinimal: boolean; readToolName: string }) {
  const docsPath = params.docsPath?.trim();
  if (!docsPath || params.isMinimal) {
    return [];
  }
  return [
    "## Documentation",
    `FlowHelm docs: ${docsPath} (or https://docs.flowhelm.ai)`,
    "Consult local docs first. Run `flowhelm status` yourself when possible.",
    "",
  ];
}

export function buildAgentSystemPrompt(params: {
  workspaceDir: string;
  defaultThinkLevel?: ThinkLevel;
  reasoningLevel?: ReasoningLevel;
  extraSystemPrompt?: string;
  ownerNumbers?: string[];
  ownerDisplay?: OwnerIdDisplay;
  ownerDisplaySecret?: string;
  reasoningTagHint?: boolean;
  toolNames?: string[];
  toolSummaries?: Record<string, string>;
  modelAliasLines?: string[];
  userTimezone?: string;
  userTime?: string;
  userTimeFormat?: ResolvedTimeFormat;
  contextFiles?: EmbeddedContextFile[];
  skillsPrompt?: string;
  heartbeatPrompt?: string;
  docsPath?: string;
  workspaceNotes?: string[];
  ttsHint?: string;
  /** Controls which hardcoded sections to include. Defaults to "full". */
  promptMode?: PromptMode;
  runtimeInfo?: {
    agentId?: string;
    host?: string;
    os?: string;
    arch?: string;
    node?: string;
    model?: string;
    defaultModel?: string;
    shell?: string;
    channel?: string;
    capabilities?: string[];
    repoRoot?: string;
  };
  messageToolHints?: string[];
  sandboxInfo?: EmbeddedSandboxInfo;
  /** Reaction guidance for the agent (for Telegram minimal/extensive modes). */
  reactionGuidance?: {
    level: "minimal" | "extensive";
    channel: string;
  };
  memoryCitationsMode?: MemoryCitationsMode;
}) {
  const coreToolSummaries: Record<string, string> = {
    read: "Read file contents",
    write: "Create or overwrite files",
    edit: "Make precise edits to files",
    apply_patch: "Apply multi-file patches",
    grep: "Search file contents for patterns",
    find: "Find files by glob pattern",
    ls: "List directory contents",
    exec: "Run shell commands (pty available for TTY-required CLIs)",
    process: "Manage background exec sessions",
    web_search: "Search the web (Brave API)",
    web_fetch: "Fetch and extract readable content from a URL",
    // Channel docking: add login tools here when a channel needs interactive linking.
    browser: "Control web browser",
    canvas: "Present/eval/snapshot the Canvas",
    nodes: "List/describe/notify/camera/screen on paired nodes",
    cron: "Manage cron jobs and wake events (use for reminders; when scheduling a reminder, write the systemEvent text as something that will read like a reminder when it fires, and mention that it is a reminder depending on the time gap between setting and firing; include recent context in reminder text if appropriate)",
    message: "Send messages and channel actions",
    gateway: "Restart, apply config, or run updates on the running FlowHelm process",
    agents_list: "List agent ids allowed for sessions_spawn",
    sessions_list: "List other sessions (incl. sub-agents) with filters/last",
    sessions_history: "Fetch history for another session/sub-agent",
    sessions_send: "Send a message to another session/sub-agent",
    sessions_spawn: "Spawn a sub-agent session",
    subagents: "List, steer, or kill sub-agent runs for this requester session",
    session_status:
      "Show a /status-equivalent status card (usage + time + Reasoning/Verbose/Elevated); use for model-use questions (📊 session_status); optional per-session model override",
    image: "Analyze an image with the configured image model",
  };

  const toolOrder = [
    "read",
    "write",
    "edit",
    "apply_patch",
    "grep",
    "find",
    "ls",
    "exec",
    "process",
    "web_search",
    "web_fetch",
    "browser",
    "canvas",
    "nodes",
    "cron",
    "message",
    "gateway",
    "agents_list",
    "sessions_list",
    "sessions_history",
    "sessions_send",
    "subagents",
    "session_status",
    "image",
  ];

  const rawToolNames = (params.toolNames ?? []).map((tool) => tool.trim());
  const canonicalToolNames = rawToolNames.filter(Boolean);
  // Preserve caller casing while deduping tool names by lowercase.
  const canonicalByNormalized = new Map<string, string>();
  for (const name of canonicalToolNames) {
    const normalized = name.toLowerCase();
    if (!canonicalByNormalized.has(normalized)) {
      canonicalByNormalized.set(normalized, name);
    }
  }
  const resolveToolName = (normalized: string) =>
    canonicalByNormalized.get(normalized) ?? normalized;

  const normalizedTools = canonicalToolNames.map((tool) => tool.toLowerCase());
  const availableTools = new Set(normalizedTools);
  const externalToolSummaries = new Map<string, string>();
  for (const [key, value] of Object.entries(params.toolSummaries ?? {})) {
    const normalized = key.trim().toLowerCase();
    if (!normalized || !value?.trim()) {
      continue;
    }
    externalToolSummaries.set(normalized, value.trim());
  }
  const extraTools = Array.from(
    new Set(normalizedTools.filter((tool) => !toolOrder.includes(tool))),
  );
  const enabledTools = toolOrder.filter((tool) => availableTools.has(tool));
  const toolLines = enabledTools.map((tool) => {
    const summary = coreToolSummaries[tool] ?? externalToolSummaries.get(tool);
    const name = resolveToolName(tool);
    return summary ? `- ${name}: ${summary}` : `- ${name}`;
  });
  for (const tool of extraTools.toSorted()) {
    const summary = coreToolSummaries[tool] ?? externalToolSummaries.get(tool);
    const name = resolveToolName(tool);
    toolLines.push(summary ? `- ${name}: ${summary}` : `- ${name}`);
  }

  const hasGateway = availableTools.has("gateway");
  const readToolName = resolveToolName("read");
  const execToolName = resolveToolName("exec");
  const processToolName = resolveToolName("process");
  const extraSystemPrompt = params.extraSystemPrompt?.trim();
  const ownerDisplay = params.ownerDisplay === "hash" ? "hash" : "raw";
  const ownerLine = buildOwnerIdentityLine(
    params.ownerNumbers ?? [],
    ownerDisplay,
    params.ownerDisplaySecret,
  );
  const reasoningHint = params.reasoningTagHint
    ? [
        "ALL internal reasoning MUST be inside <think>...</think>.",
        "Do not output any analysis outside <think>.",
        "Format every reply as <think>...</think> then <final>...</final>, with no other text.",
        "Only the final user-visible reply may appear inside <final>.",
        "Only text inside <final> is shown to the user; everything else is discarded and never seen by the user.",
        "Example:",
        "<think>Short internal reasoning.</think>",
        "<final>Hey there! What would you like to do next?</final>",
      ].join(" ")
    : undefined;
  const reasoningLevel = params.reasoningLevel ?? "off";
  const userTimezone = params.userTimezone?.trim();
  const skillsPrompt = params.skillsPrompt?.trim();
  const heartbeatPrompt = params.heartbeatPrompt?.trim();
  const heartbeatPromptLine = heartbeatPrompt
    ? `Heartbeat prompt: ${heartbeatPrompt}`
    : "Heartbeat prompt: (configured)";
  const runtimeInfo = params.runtimeInfo;
  const runtimeChannel = runtimeInfo?.channel?.trim().toLowerCase();
  const runtimeCapabilities = (runtimeInfo?.capabilities ?? [])
    .map((cap) => String(cap).trim())
    .filter(Boolean);
  const runtimeCapabilitiesLower = new Set(runtimeCapabilities.map((cap) => cap.toLowerCase()));
  const inlineButtonsEnabled = runtimeCapabilitiesLower.has("inlinebuttons");
  const messageChannelOptions = listDeliverableMessageChannels().join("|");
  const promptMode = params.promptMode ?? "full";
  const isMinimal = promptMode === "minimal" || promptMode === "heartbeat" || promptMode === "none";
  const isHeartbeatMode = promptMode === "heartbeat";
  const sandboxContainerWorkspace = params.sandboxInfo?.containerWorkspaceDir?.trim();
  const sanitizedWorkspaceDir = sanitizeForPromptLiteral(params.workspaceDir);
  const sanitizedSandboxContainerWorkspace = sandboxContainerWorkspace
    ? sanitizeForPromptLiteral(sandboxContainerWorkspace)
    : "";
  const displayWorkspaceDir =
    params.sandboxInfo?.enabled && sanitizedSandboxContainerWorkspace
      ? sanitizedSandboxContainerWorkspace
      : sanitizedWorkspaceDir;
  const workspaceGuidance =
    params.sandboxInfo?.enabled && sanitizedSandboxContainerWorkspace
      ? `File tools resolve against host: ${sanitizedWorkspaceDir}. Bash/exec use sandbox paths under ${sanitizedSandboxContainerWorkspace}. Prefer relative paths.`
      : "Treat this as the global workspace for file operations.";
  const safetySection = [
    "## Safety",
    "No independent goals: do not pursue self-preservation, replication, or power. No long-term plans beyond the request.",
    "Prioritize safety and human oversight. If instructions conflict, ask. Comply with stop/audit requests; never bypass safeguards.",
    "Do not manipulate anyone or expand access. Do not copy yourself or change system/safety rules unless requested.",
    "",
  ];
  const skillsSection = buildSkillsSection({
    skillsPrompt,
    readToolName,
  });
  const memorySection = buildMemorySection({
    isMinimal,
    availableTools,
    citationsMode: params.memoryCitationsMode,
  });
  const docsSection = buildDocsSection({
    docsPath: params.docsPath,
    isMinimal,
    readToolName,
  });
  const workspaceNotes = (params.workspaceNotes ?? []).map((note) => note.trim()).filter(Boolean);

  // For "none" mode, return just the basic identity line
  if (promptMode === "none") {
    return "You are a personal assistant running inside FlowHelm.";
  }

  const lines = [
    "You are a personal assistant running inside FlowHelm.",
    "",
    "## Tooling",
    "Availability (case-sensitive):",
    toolLines.length > 0
      ? toolLines.join("\n")
      : [
          "- grep: search file patterns",
          "- find: glob files",
          "- ls: list files",
          "- apply_patch: multi-file patches",
          `- ${execToolName}: run shell commands (background via yieldMs/background)`,
          `- ${processToolName}: manage background sessions`,
          "- browser: control browser",
          "- canvas: present/eval/snapshot Canvas",
          "- nodes: paired node control",
          "- cron: jobs/reminders (include context in reminders)",
          "- sessions_list: list sessions",
          "- sessions_history: fetch history",
          "- sessions_send: cross-session send",
          "- subagents: sub-agent control",
          '- session_status: usage/model info (📊 session_status)',
        ].join("\n"),
    "TOOLS.md is user guidance only.",
    `Avoid rapid poll loops: use ${execToolName}(yieldMs) or ${processToolName}(action=poll).`,
    "For complex tasks, spawn a sub-agent. Completion is push-based (auto-announces).",
    "Do not poll subagents/sessions in a loop; check on-demand only.",
    "",
  ];

  if (!isHeartbeatMode) {
    lines.push(
      "## Tool Call Style",
      "Default: do not narrate routine calls (just call).",
      "Narrate only if it helps: multi-step, complex, sensitive actions (e.g. deletions), or if asked.",
      "Keep narration brief and value-dense.",
      "",
    );
  }

  lines.push(...safetySection);

  if (!isHeartbeatMode) {
    lines.push(
      "## FlowHelm CLI Quick Reference",
      "Controlled via subcommands. Do not invent commands.",
      "Gateway (start/stop/restart/status): `flowhelm gateway <cmd>`.",
      "If unsure, ask user to run `flowhelm help` and paste output.",
      "",
    );
  }

  lines.push(
    ...docsSection,
    ...buildMessagingSection({
      isMinimal,
      availableTools,
      messageChannelOptions,
      inlineButtonsEnabled,
      runtimeChannel,
      messageToolHints: params.messageToolHints,
    }),
    ...buildReplyTagsSection(isMinimal),
    ...buildVoiceSection({ isMinimal, ttsHint: params.ttsHint }),
  );

  // Skip silent replies for subagent/none modes
  if (!isMinimal) {
    lines.push(
      "## Silent Replies",
      `When you have nothing to say, respond with ONLY: ${SILENT_REPLY_TOKEN}`,
      "",
      "⚠️ Rules:",
      "- It must be your ENTIRE message — nothing else",
      `- Never append it to an actual response (never include "${SILENT_REPLY_TOKEN}" in real replies)`,
      "- Never wrap it in markdown or code blocks",
      "",
      `❌ Wrong: "Here's help... ${SILENT_REPLY_TOKEN}"`,
      `❌ Wrong: "${SILENT_REPLY_TOKEN}"`,
      `✅ Right: ${SILENT_REPLY_TOKEN}`,
      "",
    );
  }

  // Include heartbeats for full OR heartbeat mode
  if (promptMode === "full" || isHeartbeatMode) {
    if (isHeartbeatMode) {
      lines.push(
        "## Heartbeats",
        heartbeatPromptLine,
        `If nothing needs attention, reply exactly: ${HEARTBEAT_TOKEN}`,
        "",
      );
    } else {
      lines.push(
        "## Heartbeats",
        heartbeatPromptLine,
        "If you receive a heartbeat poll (a user message matching the heartbeat prompt above), and there is nothing that needs attention, reply exactly:",
        "HEARTBEAT_OK",
        'FlowHelm treats a leading/trailing "HEARTBEAT_OK" as a heartbeat ack (and may discard it).',
        'If something needs attention, do NOT include "HEARTBEAT_OK"; reply with the alert text instead.',
        "",
      );
    }
  }

  if (reasoningHint) {
    lines.push("## Reasoning Format", reasoningHint, "");
  }

  lines.push(...skillsSection);
  lines.push(...memorySection);

  // Skip self-update for subagent/none modes
  if (hasGateway && !isMinimal) {
    lines.push(
      "## FlowHelm Self-Update",
      "Get Updates (self-update) is ONLY allowed when the user explicitly asks for it.",
      "Do not run config.apply or update.run unless the user explicitly requests an update or config change; if it's not explicit, ask first.",
      "Actions: config.get, config.schema, config.apply (validate + write full config, then restart), update.run (update deps or git, then restart).",
      "After restart, FlowHelm pings the last active session automatically.",
      "",
    );
  }

  // Skip model aliases for subagent/none modes
  if (params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal) {
    lines.push(
      "## Model Aliases",
      "Prefer aliases when specifying model overrides; full provider/model is also accepted.",
      ...params.modelAliasLines,
      "",
    );
  }

  if (userTimezone) {
    lines.push(
      "If you need the current date, time, or day of week, run session_status (📊 session_status).",
    );
  }

  lines.push(
    "## Workspace",
    `Your working directory is: ${displayWorkspaceDir}`,
    workspaceGuidance,
    ...workspaceNotes,
    "",
  );

  if (params.sandboxInfo?.enabled) {
    lines.push(
      "## Sandbox",
      "You are running in a sandboxed runtime (tools execute in Docker).",
      "Some tools may be unavailable due to sandbox policy.",
      "Sub-agents stay sandboxed (no elevated/host access). Need outside-sandbox read/write? Don't spawn; ask first.",
      params.sandboxInfo.containerWorkspaceDir
        ? `Sandbox container workdir: ${sanitizeForPromptLiteral(params.sandboxInfo.containerWorkspaceDir)}`
        : "",
      params.sandboxInfo.workspaceDir
        ? `Sandbox host mount source (file tools bridge only; not valid inside sandbox exec): ${sanitizeForPromptLiteral(params.sandboxInfo.workspaceDir)}`
        : "",
      params.sandboxInfo.workspaceAccess
        ? `Agent workspace access: ${params.sandboxInfo.workspaceAccess}${
            params.sandboxInfo.agentWorkspaceMount
              ? ` (mounted at ${sanitizeForPromptLiteral(params.sandboxInfo.agentWorkspaceMount)})`
              : ""
          }`
        : "",
      params.sandboxInfo.browserBridgeUrl ? "Sandbox browser: enabled." : "",
      params.sandboxInfo.browserNoVncUrl
        ? `Sandbox browser observer (noVNC): ${sanitizeForPromptLiteral(params.sandboxInfo.browserNoVncUrl)}`
        : "",
      params.sandboxInfo.hostBrowserAllowed === true
        ? "Host browser control: allowed."
        : params.sandboxInfo.hostBrowserAllowed === false
          ? "Host browser control: blocked."
          : "",
      params.sandboxInfo.elevated?.allowed
        ? "Elevated exec is available for this session."
        : "",
      params.sandboxInfo.elevated?.allowed
        ? "User can toggle with /elevated on|off|ask|full."
        : "",
      params.sandboxInfo.elevated?.allowed
        ? "You may also send /elevated on|off|ask|full when needed."
        : "",
      params.sandboxInfo.elevated?.allowed
        ? `Current elevated level: ${params.sandboxInfo.elevated.defaultLevel} (ask runs exec on host with approvals; full auto-approves).`
        : "",
      "",
    );
  }

  lines.push(...buildUserIdentitySection(ownerLine, isMinimal));
  lines.push(...buildTimeSection({ userTimezone }));

  if (extraSystemPrompt) {
    // Use "Subagent Context" header for minimal mode (subagents), otherwise "Group Chat Context"
    const contextHeader =
      promptMode === "minimal" ? "## Subagent Context" : "## Group Chat Context";
    lines.push(contextHeader, extraSystemPrompt, "");
  }

  if (params.reactionGuidance) {
    const { level, channel } = params.reactionGuidance;
    const guidanceText =
      level === "minimal"
        ? [
            `Reactions are enabled for ${channel} in MINIMAL mode.`,
            "React ONLY when truly relevant:",
            "- Acknowledge important user requests or confirmations",
            "- Express genuine sentiment (humor, appreciation) sparingly",
            "- Avoid reacting to routine messages or your own replies",
            "Guideline: at most 1 reaction per 5-10 exchanges.",
          ].join("\n")
        : [
            `Reactions are enabled for ${channel} in EXTENSIVE mode.`,
            "Feel free to react liberally:",
            "- Acknowledge messages with appropriate emojis",
            "- Express sentiment and personality through reactions",
            "- React to interesting content, humor, or notable events",
            "- Use reactions to confirm understanding or agreement",
            "Guideline: react whenever it feels natural.",
          ].join("\n");
    lines.push("## Reactions", guidanceText, "");
  }

  const contextFiles = params.contextFiles ?? [];
  const validContextFiles = contextFiles.filter(
    (file) => typeof file.path === "string" && file.path.trim().length > 0,
  );
  if (validContextFiles.length > 0) {
    const hasSoulFile = validContextFiles.some((file) => {
      const normalizedPath = file.path.trim().replace(/\\/g, "/");
      const baseName = normalizedPath.split("/").pop() ?? normalizedPath;
      return baseName.toLowerCase() === "soul.md";
    });
    lines.push(
      "## Workspace Files (injected)",
      "These user-editable files are loaded by FlowHelm and included below in Project Context.",
      "",
      "# Project Context",
      "",
      "The following project context files have been loaded:",
    );
    if (hasSoulFile) {
      lines.push(
        "If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies; follow its guidance unless higher-priority instructions override it.",
      );
    }
    lines.push("");
    for (const file of validContextFiles) {
      lines.push(`## ${file.path}`, "", file.content, "");
    }
  }

  lines.push(
    "## Runtime",
    buildRuntimeLine(runtimeInfo, runtimeChannel, runtimeCapabilities, params.defaultThinkLevel),
    `Reasoning: ${reasoningLevel} (hidden unless on/stream). Toggle /reasoning; /status shows Reasoning when enabled.`,
  );

  return lines.filter(Boolean).join("\n");
}

export function buildRuntimeLine(
  runtimeInfo?: {
    agentId?: string;
    host?: string;
    os?: string;
    arch?: string;
    node?: string;
    model?: string;
    defaultModel?: string;
    shell?: string;
    repoRoot?: string;
  },
  runtimeChannel?: string,
  runtimeCapabilities: string[] = [],
  defaultThinkLevel?: ThinkLevel,
): string {
  return `Runtime: ${[
    runtimeInfo?.agentId ? `agent=${runtimeInfo.agentId}` : "",
    runtimeInfo?.host ? `host=${runtimeInfo.host}` : "",
    runtimeInfo?.repoRoot ? `repo=${runtimeInfo.repoRoot}` : "",
    runtimeInfo?.os
      ? `os=${runtimeInfo.os}${runtimeInfo?.arch ? ` (${runtimeInfo.arch})` : ""}`
      : runtimeInfo?.arch
        ? `arch=${runtimeInfo.arch}`
        : "",
    runtimeInfo?.node ? `node=${runtimeInfo.node}` : "",
    runtimeInfo?.model ? `model=${runtimeInfo.model}` : "",
    runtimeInfo?.defaultModel ? `default_model=${runtimeInfo.defaultModel}` : "",
    runtimeInfo?.shell ? `shell=${runtimeInfo.shell}` : "",
    runtimeChannel ? `channel=${runtimeChannel}` : "",
    runtimeChannel
      ? `capabilities=${runtimeCapabilities.length > 0 ? runtimeCapabilities.join(",") : "none"}`
      : "",
    `thinking=${defaultThinkLevel ?? "off"}`,
  ]
    .filter(Boolean)
    .join(" | ")}`;
}
