import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "flowhelm",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "flowhelm", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "flowhelm", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "flowhelm", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "flowhelm", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "flowhelm", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "flowhelm", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "flowhelm", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "flowhelm", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".flowhelm-dev");
    expect(env.FLOWHELM_PROFILE).toBe("dev");
    expect(env.FLOWHELM_STATE_DIR).toBe(expectedStateDir);
    expect(env.FLOWHELM_CONFIG_PATH).toBe(path.join(expectedStateDir, "flowhelm.json"));
    expect(env.FLOWHELM_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      FLOWHELM_STATE_DIR: "/custom",
      FLOWHELM_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.FLOWHELM_STATE_DIR).toBe("/custom");
    expect(env.FLOWHELM_GATEWAY_PORT).toBe("19099");
    expect(env.FLOWHELM_CONFIG_PATH).toBe(path.join("/custom", "flowhelm.json"));
  });

  it("uses FLOWHELM_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      FLOWHELM_HOME: "/srv/flowhelm-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/flowhelm-home");
    expect(env.FLOWHELM_STATE_DIR).toBe(path.join(resolvedHome, ".flowhelm-work"));
    expect(env.FLOWHELM_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".flowhelm-work", "flowhelm.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "flowhelm doctor --fix",
      env: {},
      expected: "flowhelm doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "flowhelm doctor --fix",
      env: { FLOWHELM_PROFILE: "default" },
      expected: "flowhelm doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "flowhelm doctor --fix",
      env: { FLOWHELM_PROFILE: "Default" },
      expected: "flowhelm doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "flowhelm doctor --fix",
      env: { FLOWHELM_PROFILE: "bad profile" },
      expected: "flowhelm doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "flowhelm --profile work doctor --fix",
      env: { FLOWHELM_PROFILE: "work" },
      expected: "flowhelm --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "flowhelm --dev doctor",
      env: { FLOWHELM_PROFILE: "dev" },
      expected: "flowhelm --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("flowhelm doctor --fix", { FLOWHELM_PROFILE: "work" })).toBe(
      "flowhelm --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("flowhelm doctor --fix", { FLOWHELM_PROFILE: "  jbflowhelm  " })).toBe(
      "flowhelm --profile jbflowhelm doctor --fix",
    );
  });

  it("handles command with no args after flowhelm", () => {
    expect(formatCliCommand("flowhelm", { FLOWHELM_PROFILE: "test" })).toBe(
      "flowhelm --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm flowhelm doctor", { FLOWHELM_PROFILE: "work" })).toBe(
      "pnpm flowhelm --profile work doctor",
    );
  });
});
