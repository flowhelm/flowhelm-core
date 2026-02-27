import { createNonExitingRuntime, type RuntimeEnv } from "../runtime.js";

/**
 * Creates a standard plugin runtime environment for testing.
 */
export function createRuntimeEnv(): RuntimeEnv {
  return createNonExitingRuntime();
}
