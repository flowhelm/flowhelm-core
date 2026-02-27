import type { FlowHelmConfig } from "./config.js";

export function ensurePluginAllowlisted(cfg: FlowHelmConfig, pluginId: string): FlowHelmConfig {
  const allow = cfg.plugins?.allow;
  if (!Array.isArray(allow) || allow.includes(pluginId)) {
    return cfg;
  }
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      allow: [...allow, pluginId],
    },
  };
}
