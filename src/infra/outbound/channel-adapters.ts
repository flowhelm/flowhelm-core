import type { ChannelId } from "../../channels/plugins/types.js";
import type { FlowHelmConfig } from "../../config/config.js";

export type CrossContextComponentsBuilder = (message: string) => any[];

export type CrossContextComponentsFactory = (params: {
  originLabel: string;
  message: string;
  cfg: FlowHelmConfig;
  accountId?: string | null;
}) => any[];

export type ChannelMessageAdapter = {
  supportsComponentsV2: boolean;
  buildCrossContextComponents?: CrossContextComponentsFactory;
};

const DEFAULT_ADAPTER: ChannelMessageAdapter = {
  supportsComponentsV2: false,
};

export function getChannelMessageAdapter(_channel: ChannelId): ChannelMessageAdapter {
  return DEFAULT_ADAPTER;
}
