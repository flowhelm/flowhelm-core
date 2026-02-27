import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import type { FlowHelmConfig } from "../../config/config.js";
import { setActivePluginRegistry } from "../../plugins/runtime.js";
import type { TelegramProbe } from "../../telegram/probe.js";
import type { TelegramTokenResolution } from "../../telegram/token.js";
import {
  createTestRegistry,
} from "../../test-utils/channel-plugins.js";
import { getChannelPluginCatalogEntry, listChannelPluginCatalogEntries } from "./catalog.js";
import { resolveChannelConfigWrites } from "./config-writes.js";
import {
  listTelegramDirectoryGroupsFromConfig,
  listTelegramDirectoryPeersFromConfig,
} from "./directory-config.js";
import { listChannelPlugins } from "./index.js";
import { loadChannelPlugin } from "./load.js";
import { loadChannelOutboundAdapter } from "./outbound/load.js";
import type { ChannelDirectoryEntry, ChannelPlugin } from "./types.js";
import type { BaseProbeResult, BaseTokenResolution } from "./types.js";

describe("channel plugin registry", () => {
  const emptyRegistry = createTestRegistry([]);

  const createPlugin = (id: string): ChannelPlugin => ({
    id,
    meta: {
      id,
      label: id,
      selectionLabel: id,
      docsPath: `/channels/${id}`,
      blurb: "test",
    },
    capabilities: { chatTypes: ["direct"] },
    config: {
      listAccountIds: () => [],
      resolveAccount: () => ({}),
    },
  });

  beforeEach(() => {
    setActivePluginRegistry(emptyRegistry);
  });

  afterEach(() => {
    setActivePluginRegistry(emptyRegistry);
  });

  it("sorts channel plugins by configured order", () => {
    const registry = createTestRegistry(
      ["telegram"].map((id) => ({
        pluginId: id,
        plugin: createPlugin(id),
        source: "test",
      })),
    );
    setActivePluginRegistry(registry);
    const pluginIds = listChannelPlugins().map((plugin) => plugin.id);
    expect(pluginIds).toEqual(["telegram"]);
  });
});

describe("channel plugin catalog", () => {
  it("lists plugin catalog entries", () => {
    const ids = listChannelPluginCatalogEntries().map((entry) => entry.id);
    expect(ids).toContain("telegram");
  });
});

const emptyRegistry = createTestRegistry([]);

describe("BaseProbeResult assignability", () => {
  it("TelegramProbe satisfies BaseProbeResult", () => {
    expectTypeOf<TelegramProbe>().toMatchTypeOf<BaseProbeResult>();
  });
});

describe("BaseTokenResolution assignability", () => {
  it("Telegram token resolutions satisfy BaseTokenResolution", () => {
    expectTypeOf<TelegramTokenResolution>().toMatchTypeOf<BaseTokenResolution>();
  });
});

describe("resolveChannelConfigWrites", () => {
  it("defaults to allow when unset", () => {
    const cfg = {};
    expect(resolveChannelConfigWrites({ cfg, channelId: "telegram" })).toBe(true);
  });
});

describe("directory (config-backed)", () => {
  it("lists Telegram peers/groups from config", async () => {
    const cfg = {
      channels: {
        telegram: {
          botToken: "telegram-test",
          allowFrom: ["123", "alice", "tg:@bob"],
          dms: { "456": {} },
          groups: { "-1001": {}, "*": {} },
        },
      },
      // oxlint-disable-next-line typescript/no-explicit-any
    } as any;

    const listFn: any = listTelegramDirectoryPeersFromConfig;
    const entries = await listFn({
      cfg,
      accountId: "default",
      query: null,
      limit: null,
    });
    const ids = entries.map((entry: any) => entry.id).toSorted();
    expect(ids).toEqual(["123", "456", "@alice", "@bob"]);

    const listGroupsFn: any = listTelegramDirectoryGroupsFromConfig;
    const groupEntries = await listGroupsFn({
      cfg,
      accountId: "default",
      query: null,
      limit: null,
    });
    expect(groupEntries.map((entry: any) => entry.id)).toEqual(["-1001"]);
  });
});
