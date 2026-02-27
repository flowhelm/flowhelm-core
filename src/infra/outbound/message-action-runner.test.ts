import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { telegramPlugin } from "../../../extensions/telegram/src/channel.js";
import type { FlowHelmConfig } from "../../config/config.js";
import { setActivePluginRegistry } from "../../plugins/runtime.js";
import { createTestRegistry } from "../../test-utils/channel-plugins.js";
import { runMessageAction } from "./message-action-runner.js";

const telegramConfig = {
  channels: {
    telegram: {
      botToken: "tg-test",
    },
  },
} as FlowHelmConfig;

const runDryAction = (params: {
  cfg: FlowHelmConfig;
  action: "send" | "thread-reply" | "broadcast";
  actionParams: Record<string, unknown>;
  toolContext?: Record<string, unknown>;
  abortSignal?: AbortSignal;
  sandboxRoot?: string;
}) =>
  runMessageAction({
    cfg: params.cfg,
    action: params.action,
    params: params.actionParams as never,
    toolContext: params.toolContext as never,
    dryRun: true,
    abortSignal: params.abortSignal,
    sandboxRoot: params.sandboxRoot,
  });

const runDrySend = (params: {
  cfg: FlowHelmConfig;
  actionParams: Record<string, unknown>;
  toolContext?: Record<string, unknown>;
  abortSignal?: AbortSignal;
  sandboxRoot?: string;
}) =>
  runDryAction({
    ...params,
    action: "send",
  });

let createPluginRuntime: typeof import("../../plugins/runtime/index.js").createPluginRuntime;
let setTelegramRuntime: typeof import("../../../extensions/telegram/src/runtime.js").setTelegramRuntime;

function installChannelRuntimes() {
  const runtime = createPluginRuntime();
  setTelegramRuntime(runtime);
}

describe("runMessageAction context isolation", () => {
  beforeAll(async () => {
    ({ createPluginRuntime } = await import("../../plugins/runtime/index.js"));
    ({ setTelegramRuntime } = await import("../../../extensions/telegram/src/runtime.js"));
  });

  beforeEach(() => {
    installChannelRuntimes();
    setActivePluginRegistry(
      createTestRegistry([
        {
          pluginId: "telegram",
          source: "test",
          plugin: telegramPlugin,
        },
      ]),
    );
  });

  afterEach(() => {
    setActivePluginRegistry(createTestRegistry([]));
  });

  it("allows send when target matches current channel", async () => {
    const result = await runDrySend({
      cfg: telegramConfig,
      actionParams: {
        channel: "telegram",
        target: "12345678",
        message: "hi",
      },
      toolContext: { currentChannelId: "12345678" },
    });

    expect(result.kind).toBe("send");
  });

  it("defaults to current channel when target is omitted", async () => {
    const result = await runDrySend({
      cfg: telegramConfig,
      actionParams: {
        channel: "telegram",
        message: "hi",
      },
      toolContext: { currentChannelId: "12345678" },
    });

    expect(result.kind).toBe("send");
  });

  it("requires message when no media hint is provided", async () => {
    await expect(
      runDrySend({
        cfg: telegramConfig,
        actionParams: {
          channel: "telegram",
          target: "12345678",
        },
        toolContext: { currentChannelId: "12345678" },
      }),
    ).rejects.toThrow(/message required/i);
  });
});
