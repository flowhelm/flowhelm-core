import type { PluginRuntime } from "flowhelm/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setTelegramRuntime(next: PluginRuntime) {
  runtime = next;
}

export function getTelegramRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("Telegram runtime not initialized");
  }
  return runtime;
}
