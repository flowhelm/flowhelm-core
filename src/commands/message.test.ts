import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ChannelMessageActionAdapter,
  ChannelOutboundAdapter,
  ChannelPlugin,
} from "../channels/plugins/types.js";
import type { CliDeps } from "../cli/deps.js";
import type { RuntimeEnv } from "../runtime.js";
import { createTestRegistry } from "../test-utils/channel-plugins.js";
import { captureEnv } from "../test-utils/env.js";

let testConfig: Record<string, unknown> = {};
vi.mock("../config/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config/config.js")>();
  return {
    ...actual,
    loadConfig: () => testConfig,
  };
});

const callGatewayMock = vi.fn();
vi.mock("../gateway/call.js", () => ({
  callGateway: callGatewayMock,
  callGatewayLeastPrivilege: callGatewayMock,
  randomIdempotencyKey: () => "idem-1",
}));

const handleTelegramAction = vi.fn(async (..._args: unknown[]) => ({ details: { ok: true } }));
vi.mock("../agents/tools/telegram-actions.js", () => ({
  handleTelegramAction,
}));

let envSnapshot: ReturnType<typeof captureEnv>;

const setRegistry = async (registry: ReturnType<typeof createTestRegistry>) => {
  const { setActivePluginRegistry } = await import("../plugins/runtime.js");
  setActivePluginRegistry(registry);
};

beforeEach(async () => {
  envSnapshot = captureEnv(["TELEGRAM_BOT_TOKEN"]);
  process.env.TELEGRAM_BOT_TOKEN = "";
  testConfig = {};
  await setRegistry(createTestRegistry([]));
  callGatewayMock.mockClear();
  handleTelegramAction.mockClear();
});

afterEach(() => {
  envSnapshot.restore();
});

const runtime: RuntimeEnv = {
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(() => {
    throw new Error("exit");
  }),
};

const makeDeps = (overrides: Partial<CliDeps> = {}): CliDeps => ({
  sendMessageTelegram: vi.fn(),
  ...overrides,
});

const createStubPlugin = (params: {
  id: ChannelPlugin["id"];
  label?: string;
  actions?: ChannelMessageActionAdapter;
  outbound?: ChannelOutboundAdapter;
}): ChannelPlugin => ({
  id: params.id,
  meta: {
    id: params.id,
    label: params.label ?? String(params.id),
    selectionLabel: params.label ?? String(params.id),
    docsPath: `/channels/${params.id}`,
    blurb: "test stub.",
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: () => ["default"],
    resolveAccount: () => ({}),
    isConfigured: async () => true,
  },
  actions: params.actions,
  outbound: params.outbound,
});

type ChannelActionParams = Parameters<
  NonNullable<NonNullable<ChannelPlugin["actions"]>["handleAction"]>
>[0];

const createTelegramSendPluginRegistration = () => ({
  pluginId: "telegram",
  source: "test",
  plugin: createStubPlugin({
    id: "telegram",
    label: "Telegram",
    actions: {
      listActions: () => ["send"],
      handleAction: (async ({ action, params, cfg, accountId }: ChannelActionParams) => {
        return await handleTelegramAction(
          { action, to: params.to, accountId: accountId ?? undefined },
          cfg,
        );
      }) as unknown as NonNullable<ChannelPlugin["actions"]>["handleAction"],
    },
  }),
});

const { messageCommand } = await import("./message.js");

describe("messageCommand", () => {
  it("defaults channel when only one configured", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "token-abc";
    await setRegistry(
      createTestRegistry([
        {
          ...createTelegramSendPluginRegistration(),
        },
      ]),
    );
    const deps = makeDeps();
    await messageCommand(
      {
        target: "123456",
        message: "hi",
      },
      deps,
      runtime,
    );
    expect(handleTelegramAction).toHaveBeenCalled();
  });
});
