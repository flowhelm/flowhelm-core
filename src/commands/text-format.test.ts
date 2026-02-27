import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("flowhelm", 16)).toBe("flowhelm");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("flowhelm-status-output", 10)).toBe("flowhelm-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
