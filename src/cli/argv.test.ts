import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it.each([
    {
      name: "help flag",
      argv: ["node", "flowhelm", "--help"],
      expected: true,
    },
    {
      name: "version flag",
      argv: ["node", "flowhelm", "-V"],
      expected: true,
    },
    {
      name: "normal command",
      argv: ["node", "flowhelm", "status"],
      expected: false,
    },
    {
      name: "root -v alias",
      argv: ["node", "flowhelm", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "flowhelm", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with log-level",
      argv: ["node", "flowhelm", "--log-level", "debug", "-v"],
      expected: true,
    },
    {
      name: "subcommand -v should not be treated as version",
      argv: ["node", "flowhelm", "acp", "-v"],
      expected: false,
    },
    {
      name: "root -v alias with equals profile",
      argv: ["node", "flowhelm", "--profile=work", "-v"],
      expected: true,
    },
    {
      name: "subcommand path after global root flags should not be treated as version",
      argv: ["node", "flowhelm", "--dev", "skills", "list", "-v"],
      expected: false,
    },
  ])("detects help/version flags: $name", ({ argv, expected }) => {
    expect(hasHelpOrVersion(argv)).toBe(expected);
  });

  it.each([
    {
      name: "single command with trailing flag",
      argv: ["node", "flowhelm", "status", "--json"],
      expected: ["status"],
    },
    {
      name: "two-part command",
      argv: ["node", "flowhelm", "agents", "list"],
      expected: ["agents", "list"],
    },
    {
      name: "terminator cuts parsing",
      argv: ["node", "flowhelm", "status", "--", "ignored"],
      expected: ["status"],
    },
  ])("extracts command path: $name", ({ argv, expected }) => {
    expect(getCommandPath(argv, 2)).toEqual(expected);
  });

  it.each([
    {
      name: "returns first command token",
      argv: ["node", "flowhelm", "agents", "list"],
      expected: "agents",
    },
    {
      name: "returns null when no command exists",
      argv: ["node", "flowhelm"],
      expected: null,
    },
  ])("returns primary command: $name", ({ argv, expected }) => {
    expect(getPrimaryCommand(argv)).toBe(expected);
  });

  it.each([
    {
      name: "detects flag before terminator",
      argv: ["node", "flowhelm", "status", "--json"],
      flag: "--json",
      expected: true,
    },
    {
      name: "ignores flag after terminator",
      argv: ["node", "flowhelm", "--", "--json"],
      flag: "--json",
      expected: false,
    },
  ])("parses boolean flags: $name", ({ argv, flag, expected }) => {
    expect(hasFlag(argv, flag)).toBe(expected);
  });

  it.each([
    {
      name: "value in next token",
      argv: ["node", "flowhelm", "status", "--timeout", "5000"],
      expected: "5000",
    },
    {
      name: "value in equals form",
      argv: ["node", "flowhelm", "status", "--timeout=2500"],
      expected: "2500",
    },
    {
      name: "missing value",
      argv: ["node", "flowhelm", "status", "--timeout"],
      expected: null,
    },
    {
      name: "next token is another flag",
      argv: ["node", "flowhelm", "status", "--timeout", "--json"],
      expected: null,
    },
    {
      name: "flag appears after terminator",
      argv: ["node", "flowhelm", "--", "--timeout=99"],
      expected: undefined,
    },
  ])("extracts flag values: $name", ({ argv, expected }) => {
    expect(getFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "flowhelm", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "flowhelm", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "flowhelm", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it.each([
    {
      name: "missing flag",
      argv: ["node", "flowhelm", "status"],
      expected: undefined,
    },
    {
      name: "missing value",
      argv: ["node", "flowhelm", "status", "--timeout"],
      expected: null,
    },
    {
      name: "valid positive integer",
      argv: ["node", "flowhelm", "status", "--timeout", "5000"],
      expected: 5000,
    },
    {
      name: "invalid integer",
      argv: ["node", "flowhelm", "status", "--timeout", "nope"],
      expected: undefined,
    },
  ])("parses positive integer flag values: $name", ({ argv, expected }) => {
    expect(getPositiveIntFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("builds parse argv from raw args", () => {
    const cases = [
      {
        rawArgs: ["node", "flowhelm", "status"],
        expected: ["node", "flowhelm", "status"],
      },
      {
        rawArgs: ["node-22", "flowhelm", "status"],
        expected: ["node-22", "flowhelm", "status"],
      },
      {
        rawArgs: ["node-22.2.0.exe", "flowhelm", "status"],
        expected: ["node-22.2.0.exe", "flowhelm", "status"],
      },
      {
        rawArgs: ["node-22.2", "flowhelm", "status"],
        expected: ["node-22.2", "flowhelm", "status"],
      },
      {
        rawArgs: ["node-22.2.exe", "flowhelm", "status"],
        expected: ["node-22.2.exe", "flowhelm", "status"],
      },
      {
        rawArgs: ["/usr/bin/node-22.2.0", "flowhelm", "status"],
        expected: ["/usr/bin/node-22.2.0", "flowhelm", "status"],
      },
      {
        rawArgs: ["nodejs", "flowhelm", "status"],
        expected: ["nodejs", "flowhelm", "status"],
      },
      {
        rawArgs: ["node-dev", "flowhelm", "status"],
        expected: ["node", "flowhelm", "node-dev", "flowhelm", "status"],
      },
      {
        rawArgs: ["flowhelm", "status"],
        expected: ["node", "flowhelm", "status"],
      },
      {
        rawArgs: ["bun", "src/entry.ts", "status"],
        expected: ["bun", "src/entry.ts", "status"],
      },
    ] as const;

    for (const testCase of cases) {
      const parsed = buildParseArgv({
        programName: "flowhelm",
        rawArgs: [...testCase.rawArgs],
      });
      expect(parsed).toEqual([...testCase.expected]);
    }
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "flowhelm",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "flowhelm", "status"]);
  });

  it("decides when to migrate state", () => {
    const nonMutatingArgv = [
      ["node", "flowhelm", "status"],
      ["node", "flowhelm", "health"],
      ["node", "flowhelm", "sessions"],
      ["node", "flowhelm", "config", "get", "update"],
      ["node", "flowhelm", "config", "unset", "update"],
      ["node", "flowhelm", "models", "list"],
      ["node", "flowhelm", "models", "status"],
      ["node", "flowhelm", "memory", "status"],
      ["node", "flowhelm", "agent", "--message", "hi"],
    ] as const;
    const mutatingArgv = [
      ["node", "flowhelm", "agents", "list"],
      ["node", "flowhelm", "message", "send"],
    ] as const;

    for (const argv of nonMutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(false);
    }
    for (const argv of mutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(true);
    }
  });

  it.each([
    { path: ["status"], expected: false },
    { path: ["config", "get"], expected: false },
    { path: ["models", "status"], expected: false },
    { path: ["agents", "list"], expected: true },
  ])("reuses command path for migrate state decisions: $path", ({ path, expected }) => {
    expect(shouldMigrateStateFromPath(path)).toBe(expected);
  });
});
