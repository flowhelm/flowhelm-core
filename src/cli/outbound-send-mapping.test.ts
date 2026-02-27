import { describe, expect, it, vi } from "vitest";
import {
  createOutboundSendDepsFromCliSource,
  type CliOutboundSendSource,
} from "./outbound-send-mapping.js";

describe("createOutboundSendDepsFromCliSource", () => {
  it("maps CLI send deps to outbound send deps", () => {
    const deps: CliOutboundSendSource = {
      sendMessageTelegram: vi.fn() as CliOutboundSendSource["sendMessageTelegram"],
    };

    const outbound = createOutboundSendDepsFromCliSource(deps);

    expect(outbound).toEqual({
      sendTelegram: deps.sendMessageTelegram,
    });
  });
});
