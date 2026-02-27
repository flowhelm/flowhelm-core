import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FlowHelmConfig } from "../../../config/config.js";

const handleTelegramAction = vi.fn(async (..._args: unknown[]) => ({ ok: true }));

vi.mock("../../../agents/tools/telegram-actions.js", () => ({
  handleTelegramAction,
}));

const { telegramMessageActions } = await import("./telegram.js");

function telegramCfg(): FlowHelmConfig {
  return { channels: { telegram: { botToken: "tok" } } } as FlowHelmConfig;
}

type TelegramActionInput = Parameters<NonNullable<typeof telegramMessageActions.handleAction>>[0];

async function runTelegramAction(
  action: TelegramActionInput["action"],
  params: TelegramActionInput["params"],
  options?: { cfg?: FlowHelmConfig; accountId?: string },
) {
  const cfg = options?.cfg ?? telegramCfg();
  const handleAction = telegramMessageActions.handleAction;
  if (!handleAction) {
    throw new Error("telegram handleAction unavailable");
  }
  await handleAction({
    channel: "telegram",
    action,
    params,
    cfg,
    accountId: options?.accountId,
  });
  return { cfg };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("telegramMessageActions", () => {
  it("lists sticker actions only when enabled by config", () => {
    const cases = [
      {
        name: "default config",
        cfg: telegramCfg(),
        expectSticker: false,
      },
      {
        name: "per-account sticker enabled",
        cfg: {
          channels: {
            telegram: {
              accounts: {
                media: { botToken: "tok", actions: { sticker: true } },
              },
            },
          },
        } as FlowHelmConfig,
        expectSticker: true,
      },
    ] as const;

    for (const testCase of cases) {
      const actions = telegramMessageActions.listActions?.({ cfg: testCase.cfg }) ?? [];
      if (testCase.expectSticker) {
        expect(actions, testCase.name).toContain("sticker");
        expect(actions, testCase.name).toContain("sticker-search");
      } else {
        expect(actions, testCase.name).not.toContain("sticker");
        expect(actions, testCase.name).not.toContain("sticker-search");
      }
    }
  });

  it("maps action params into telegram actions", async () => {
    const cases = [
      {
        name: "media-only send preserves asVoice",
        action: "send" as const,
        params: {
          to: "123",
          media: "https://example.com/voice.ogg",
          asVoice: true,
        },
        expectedPayload: expect.objectContaining({
          action: "sendMessage",
          to: "123",
          content: "",
          mediaUrl: "https://example.com/voice.ogg",
          asVoice: true,
        }),
      },
      {
        name: "silent send forwards silent flag",
        action: "send" as const,
        params: {
          to: "456",
          message: "Silent notification test",
          silent: true,
        },
        expectedPayload: expect.objectContaining({
          action: "sendMessage",
          to: "456",
          content: "Silent notification test",
          silent: true,
        }),
      },
    ] as const;

    for (const testCase of cases) {
      handleTelegramAction.mockClear();
      const { cfg } = await runTelegramAction(testCase.action, testCase.params);
      expect(handleTelegramAction, testCase.name).toHaveBeenCalledWith(
        testCase.expectedPayload,
        cfg,
        expect.objectContaining({ mediaLocalRoots: undefined }),
      );
    }
  });
});
