import { describe, expect, test } from "vitest";
import type { ChatType } from "../channels/chat-type.js";
import type { FlowHelmConfig } from "../config/config.js";
import { resolveAgentRoute } from "./resolve-route.js";

describe("resolveAgentRoute", () => {
  test("defaults to main/default when no bindings exist", () => {
    const cfg: FlowHelmConfig = {};
    const route = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: null,
      peer: { kind: "direct", id: "12345678" },
    });
    expect(route.agentId).toBe("main");
    expect(route.accountId).toBe("default");
    expect(route.sessionKey).toBe("agent:main:main");
    expect(route.matchedBy).toBe("default");
  });

  test("dmScope controls direct-message session key isolation", () => {
    const cases = [
      { dmScope: "per-peer" as const, expected: "agent:main:direct:12345678" },
      {
        dmScope: "per-channel-peer" as const,
        expected: "agent:main:telegram:direct:12345678",
      },
    ];
    for (const testCase of cases) {
      const cfg: FlowHelmConfig = {
        session: { dmScope: testCase.dmScope },
      };
      const route = resolveAgentRoute({
        cfg,
        channel: "telegram",
        accountId: null,
        peer: { kind: "direct", id: "12345678" },
      });
      expect(route.sessionKey).toBe(testCase.expected);
    }
  });

  test("identityLinks applies to direct-message scopes", () => {
    const cases = [
      {
        dmScope: "per-peer" as const,
        channel: "telegram",
        peerId: "111111111",
        expected: "agent:main:direct:alice",
      },
    ];
    for (const testCase of cases) {
      const cfg: FlowHelmConfig = {
        session: {
          dmScope: testCase.dmScope,
          identityLinks: {
            alice: ["telegram:111111111"],
          },
        },
      };
      const route = resolveAgentRoute({
        cfg,
        channel: testCase.channel,
        accountId: null,
        peer: { kind: "direct", id: testCase.peerId },
      });
      expect(route.sessionKey).toBe(testCase.expected);
    }
  });

  test("peer binding wins over account binding", () => {
    const cfg: FlowHelmConfig = {
      bindings: [
        {
          agentId: "a",
          match: {
            channel: "telegram",
            accountId: "tasks",
            peer: { kind: "direct", id: "1000" },
          },
        },
        {
          agentId: "b",
          match: { channel: "telegram", accountId: "tasks" },
        },
      ],
    };
    const route = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: "tasks",
      peer: { kind: "direct", id: "1000" },
    });
    expect(route.agentId).toBe("a");
    expect(route.sessionKey).toBe("agent:a:main");
    expect(route.matchedBy).toBe("binding.peer");
  });

  test("missing accountId in binding matches default account only", () => {
    const cfg: FlowHelmConfig = {
      bindings: [{ agentId: "defaultAcct", match: { channel: "telegram" } }],
    };

    const defaultRoute = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: undefined,
      peer: { kind: "direct", id: "1000" },
    });
    expect(defaultRoute.agentId).toBe("defaultacct");
    expect(defaultRoute.matchedBy).toBe("binding.account");

    const otherRoute = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: "other",
      peer: { kind: "direct", id: "1000" },
    });
    expect(otherRoute.agentId).toBe("main");
  });

  test("accountId=* matches any account as a channel fallback", () => {
    const cfg: FlowHelmConfig = {
      bindings: [
        {
          agentId: "any",
          match: { channel: "telegram", accountId: "*" },
        },
      ],
    };
    const route = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: "custom",
      peer: { kind: "direct", id: "1000" },
    });
    expect(route.agentId).toBe("any");
    expect(route.matchedBy).toBe("binding.channel");
  });

  test("binding accountId matching is canonicalized", () => {
    const cfg: FlowHelmConfig = {
      bindings: [{ agentId: "biz", match: { channel: "telegram", accountId: "BIZ" } }],
    };
    const route = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: " biz ",
      peer: { kind: "direct", id: "u-1" },
    });
    expect(route.agentId).toBe("biz");
    expect(route.matchedBy).toBe("binding.account");
    expect(route.accountId).toBe("biz");
  });

  test("defaultAgentId is used when no binding matches", () => {
    const cfg: FlowHelmConfig = {
      agents: {
        list: [{ id: "home", default: true, workspace: "~/flowhelm-home" }],
      },
    };
    const route = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: "biz",
      peer: { kind: "direct", id: "1000" },
    });
    expect(route.agentId).toBe("home");
    expect(route.sessionKey).toBe("agent:home:main");
  });
});

test("dmScope=per-account-channel-peer isolates DM sessions per account, channel and sender", () => {
  const cfg: FlowHelmConfig = {
    session: { dmScope: "per-account-channel-peer" },
  };
  const route = resolveAgentRoute({
    cfg,
    channel: "telegram",
    accountId: "tasks",
    peer: { kind: "direct", id: "7550356539" },
  });
  expect(route.sessionKey).toBe("agent:main:telegram:tasks:direct:7550356539");
});

test("dmScope=per-account-channel-peer uses default accountId when not provided", () => {
  const cfg: FlowHelmConfig = {
    session: { dmScope: "per-account-channel-peer" },
  };
  const route = resolveAgentRoute({
    cfg,
    channel: "telegram",
    accountId: null,
    peer: { kind: "direct", id: "7550356539" },
  });
  expect(route.sessionKey).toBe("agent:main:telegram:default:direct:7550356539");
});

describe("backward compatibility: peer.kind dm → direct", () => {
  test("legacy dm in config matches runtime direct peer", () => {
    const cfg: FlowHelmConfig = {
      bindings: [
        {
          agentId: "alex",
          match: {
            channel: "telegram",
            // Legacy config uses "dm" instead of "direct"
            peer: { kind: "dm" as ChatType, id: "12345678" },
          },
        },
      ],
    };
    const route = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: null,
      // Runtime uses canonical "direct"
      peer: { kind: "direct", id: "12345678" },
    });
    expect(route.agentId).toBe("alex");
    expect(route.matchedBy).toBe("binding.peer");
  });

  test("runtime dm peer.kind matches config direct binding (#22730)", () => {
    const cfg: FlowHelmConfig = {
      bindings: [
        {
          agentId: "alex",
          match: {
            channel: "telegram",
            // Config uses canonical "direct"
            peer: { kind: "direct", id: "12345678" },
          },
        },
      ],
    };
    const route = resolveAgentRoute({
      cfg,
      channel: "telegram",
      accountId: null,
      // Plugin sends "dm" instead of "direct"
      peer: { kind: "dm" as ChatType, id: "12345678" },
    });
    expect(route.agentId).toBe("alex");
    expect(route.matchedBy).toBe("binding.peer");
  });
});
