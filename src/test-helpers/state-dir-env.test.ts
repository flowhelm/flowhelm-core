import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  restoreStateDirEnv,
  setStateDirEnv,
  snapshotStateDirEnv,
  withStateDirEnv,
} from "./state-dir-env.js";

type EnvSnapshot = {
  flowhelm?: string;
  legacy?: string;
};

function snapshotCurrentStateDirVars(): EnvSnapshot {
  return {
    flowhelm: process.env.FLOWHELM_STATE_DIR,
    legacy: process.env.FLOWHELM_BOT_STATE_DIR,
  };
}

function expectStateDirVars(snapshot: EnvSnapshot) {
  expect(process.env.FLOWHELM_STATE_DIR).toBe(snapshot.flowhelm);
  expect(process.env.FLOWHELM_BOT_STATE_DIR).toBe(snapshot.legacy);
}

async function expectPathMissing(filePath: string) {
  await expect(fs.stat(filePath)).rejects.toThrow();
}

async function expectStateDirEnvRestored(params: {
  prev: EnvSnapshot;
  capturedStateDir: string;
  capturedTempRoot: string;
}) {
  expectStateDirVars(params.prev);
  await expectPathMissing(params.capturedStateDir);
  await expectPathMissing(params.capturedTempRoot);
}

describe("state-dir-env helpers", () => {
  it("set/snapshot/restore round-trips FLOWHELM_STATE_DIR", () => {
    const prev = snapshotCurrentStateDirVars();
    const snapshot = snapshotStateDirEnv();

    setStateDirEnv("/tmp/flowhelm-state-dir-test");
    expect(process.env.FLOWHELM_STATE_DIR).toBe("/tmp/flowhelm-state-dir-test");
    expect(process.env.FLOWHELM_BOT_STATE_DIR).toBeUndefined();

    restoreStateDirEnv(snapshot);
    expectStateDirVars(prev);
  });

  it("withStateDirEnv sets env for callback and cleans up temp root", async () => {
    const prev = snapshotCurrentStateDirVars();

    let capturedTempRoot = "";
    let capturedStateDir = "";
    await withStateDirEnv("flowhelm-state-dir-env-", async ({ tempRoot, stateDir }) => {
      capturedTempRoot = tempRoot;
      capturedStateDir = stateDir;
      expect(process.env.FLOWHELM_STATE_DIR).toBe(stateDir);
      expect(process.env.FLOWHELM_BOT_STATE_DIR).toBeUndefined();
      await fs.writeFile(path.join(stateDir, "probe.txt"), "ok", "utf8");
    });

    await expectStateDirEnvRestored({ prev, capturedStateDir, capturedTempRoot });
  });

  it("withStateDirEnv restores env and cleans temp root when callback throws", async () => {
    const prev = snapshotCurrentStateDirVars();

    let capturedTempRoot = "";
    let capturedStateDir = "";
    await expect(
      withStateDirEnv("flowhelm-state-dir-env-", async ({ tempRoot, stateDir }) => {
        capturedTempRoot = tempRoot;
        capturedStateDir = stateDir;
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    await expectStateDirEnvRestored({ prev, capturedStateDir, capturedTempRoot });
  });

  it("withStateDirEnv restores both env vars when legacy var was previously set", async () => {
    const testSnapshot = snapshotStateDirEnv();
    process.env.FLOWHELM_STATE_DIR = "/tmp/original-flowhelm";
    process.env.FLOWHELM_BOT_STATE_DIR = "/tmp/original-legacy";
    const prev = snapshotCurrentStateDirVars();

    let capturedTempRoot = "";
    let capturedStateDir = "";
    try {
      await withStateDirEnv("flowhelm-state-dir-env-", async ({ tempRoot, stateDir }) => {
        capturedTempRoot = tempRoot;
        capturedStateDir = stateDir;
        expect(process.env.FLOWHELM_STATE_DIR).toBe(stateDir);
        expect(process.env.FLOWHELM_BOT_STATE_DIR).toBeUndefined();
      });

      await expectStateDirEnvRestored({ prev, capturedStateDir, capturedTempRoot });
    } finally {
      restoreStateDirEnv(testSnapshot);
    }
  });
});
