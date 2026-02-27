import { vi } from "vitest";
import { installChromeUserDataDirHooks } from "./chrome-user-data-dir.test-harness.js";

const chromeUserDataDir = { dir: "/tmp/flowhelm" };
installChromeUserDataDirHooks(chromeUserDataDir);

vi.mock("./chrome.js", () => ({
  isChromeCdpReady: vi.fn(async () => true),
  isChromeReachable: vi.fn(async () => true),
  launchFlowHelmChrome: vi.fn(async () => {
    throw new Error("unexpected launch");
  }),
  resolveFlowHelmUserDataDir: vi.fn(() => chromeUserDataDir.dir),
  stopFlowHelmChrome: vi.fn(async () => {}),
}));
