import type { OutboundSendDeps } from "../infra/outbound/deliver.js";
import type { sendMessageTelegram } from "../telegram/send.js";
import { createOutboundSendDepsFromCliSource } from "./outbound-send-mapping.js";

export type CliDeps = {
  sendMessageWhatsApp: any;
  sendMessageTelegram: typeof sendMessageTelegram;
  sendMessageDiscord: any;
  sendMessageSlack: any;
  sendMessageSignal: any;
  sendMessageIMessage: any;
};

export function createDefaultDeps(): CliDeps {
  return {
    sendMessageWhatsApp: async () => { throw new Error("WhatsApp stripped"); },
    sendMessageTelegram: async (...args) => {
      const { sendMessageTelegram } = await import("../telegram/send.js");
      return await sendMessageTelegram(...args);
    },
    sendMessageDiscord: async () => { throw new Error("Discord stripped"); },
    sendMessageSlack: async () => { throw new Error("Slack stripped"); },
    sendMessageSignal: async () => { throw new Error("Signal stripped"); },
    sendMessageIMessage: async () => { throw new Error("iMessage stripped"); },
  };
}

export function createOutboundSendDeps(deps: CliDeps): OutboundSendDeps {
  return createOutboundSendDepsFromCliSource(deps);
}

export { logWebSelfId } from "../web/auth-store.js";
