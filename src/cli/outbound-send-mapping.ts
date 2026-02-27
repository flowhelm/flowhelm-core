import type { OutboundSendDeps } from "../infra/outbound/deliver.js";

export type CliOutboundSendSource = {
  sendMessageWhatsApp: any;
  sendMessageTelegram: OutboundSendDeps["sendTelegram"];
  sendMessageDiscord: any;
  sendMessageSlack: any;
  sendMessageSignal: any;
  sendMessageIMessage: any;
};

// Provider docking: extend this mapping when adding new outbound send deps.
export function createOutboundSendDepsFromCliSource(deps: CliOutboundSendSource): OutboundSendDeps {
  return {
    sendTelegram: deps.sendMessageTelegram,
  } as any;
}
