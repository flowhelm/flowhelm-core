import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FlowHelmConfig } from "../../config/config.js";

const mocks = vi.hoisted(() => ({
  readConfigFileSnapshot: vi.fn(),
  writeConfigFile: vi.fn(),
}));

vi.mock("../../config/config.js", () => ({
  readConfigFileSnapshot: (...args: unknown[]) => mocks.readConfigFileSnapshot(...args),
  writeConfigFile: (...args: unknown[]) => mocks.writeConfigFile(...args),
}));

import { loadValidConfigOrThrow, updateConfig } from "./shared.js";

describe("models/shared", () => {
  beforeEach(() => {
    mocks.readConfigFileSnapshot.mockClear();
    mocks.writeConfigFile.mockClear();
  });

  it("returns config when snapshot is valid", async () => {
    const cfg = { providers: {} } as unknown as FlowHelmConfig;
    mocks.readConfigFileSnapshot.mockResolvedValue({
      valid: true,
      config: cfg,
    });

    await expect(loadValidConfigOrThrow()).resolves.toBe(cfg);
  });

  it("throws formatted issues when snapshot is invalid", async () => {
    mocks.readConfigFileSnapshot.mockResolvedValue({
      valid: false,
      path: "/tmp/flowhelm.json",
      issues: [{ path: "providers.openai.apiKey", message: "Required" }],
    });

    await expect(loadValidConfigOrThrow()).rejects.toThrowError(
      "Invalid config at /tmp/flowhelm.json\n- providers.openai.apiKey: Required",
    );
  });

  it("updateConfig writes mutated config", async () => {
    const cfg = { update: { channel: "stable" } } as unknown as FlowHelmConfig;
    mocks.readConfigFileSnapshot.mockResolvedValue({
      valid: true,
      config: cfg,
    });
    mocks.writeConfigFile.mockResolvedValue(undefined);

    await updateConfig((current) => ({
      ...current,
      update: { channel: "beta" },
    }));

    expect(mocks.writeConfigFile).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { channel: "beta" },
      }),
    );
  });
});
