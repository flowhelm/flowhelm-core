import { describe, expect, it, vi } from "vitest";
import { createEmbeddingProvider } from "../memory/embeddings.js";
import { resolveSkillsPromptForRun } from "./skills.js";
import type { SkillEntry } from "./skills/types.js";

vi.mock("../memory/embeddings.js", () => ({
  createEmbeddingProvider: vi.fn(),
}));

describe("Dynamic Skill Injection (Vector-Based)", () => {
  it("filters skills based on vector relevance when enabled", async () => {
    const entry1: SkillEntry = {
      skill: {
        name: "weather-skill",
        description: "Get weather information",
        filePath: "/app/skills/weather/SKILL.md",
        baseDir: "/app/skills/weather",
        source: "flowhelm-bundled",
        disableModelInvocation: false,
      },
      frontmatter: {},
    };
    const entry2: SkillEntry = {
      skill: {
        name: "crypto-skill",
        description: "Get cryptocurrency prices",
        filePath: "/app/skills/crypto/SKILL.md",
        baseDir: "/app/skills/crypto",
        source: "flowhelm-bundled",
        disableModelInvocation: false,
      },
      frontmatter: {},
    };

    const mockProvider = {
      id: "mock",
      model: "mock-model",
      embedQuery: vi.fn().mockImplementation(async (text: string) => {
        if (text.includes("weather")) return [1, 0];
        if (text.includes("crypto")) return [0, 1];
        if (text.includes("What's the temperature")) return [0.9, 0.1];
        return [0.5, 0.5];
      }),
    };

    vi.mocked(createEmbeddingProvider).mockResolvedValue({
      provider: mockProvider as any,
      requestedProvider: "auto",
    });

    const config = {
      skills: {
        dynamicInjection: {
          enabled: true,
          maxSkills: 1,
          minScore: 0.5,
        },
      },
    };

    const prompt = await resolveSkillsPromptForRun({
      entries: [entry1, entry2],
      workspaceDir: "/tmp/flowhelm",
      config: config as any,
      prompt: "What's the temperature in London?",
    });

    expect(prompt).toContain("weather-skill");
    expect(prompt).not.toContain("crypto-skill");
  });

  it("includes all skills when dynamic injection is disabled", async () => {
    const entry1: SkillEntry = {
      skill: {
        name: "skill1",
        description: "Desc 1",
        filePath: "f1",
        baseDir: "d1",
        source: "s",
        disableModelInvocation: false,
      },
      frontmatter: {},
    };
    const entry2: SkillEntry = {
      skill: {
        name: "skill2",
        description: "Desc 2",
        filePath: "f2",
        baseDir: "d2",
        source: "s",
        disableModelInvocation: false,
      },
      frontmatter: {},
    };

    const config = {
      skills: {
        dynamicInjection: {
          enabled: false,
        },
      },
    };

    const prompt = await resolveSkillsPromptForRun({
      entries: [entry1, entry2],
      workspaceDir: "/tmp/flowhelm",
      config: config as any,
      prompt: "query",
    });

    expect(prompt).toContain("skill1");
    expect(prompt).toContain("skill2");
  });
});
