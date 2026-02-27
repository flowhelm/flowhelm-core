import type { CommandHandlerResult } from "../commands-types.js";
import {
  type SubagentsCommandContext,
  stopWithText,
} from "./shared.js";

export async function handleSubagentsFocusAction(
  _ctx: SubagentsCommandContext,
): Promise<CommandHandlerResult> {
  return stopWithText("⚠️ /focus is only available on Discord.");
}
