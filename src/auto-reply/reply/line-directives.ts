import type { ReplyPayload } from "../types.js";

/**
 * Stripped LINE directive parser.
 */
export function parseLineDirectives(payload: ReplyPayload): ReplyPayload {
  return payload;
}

/**
 * Check if text contains any LINE directives
 */
export function hasLineDirectives(_text: string): boolean {
  return false;
}
