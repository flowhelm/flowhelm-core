import { loadMedia } from "./loader.js";
import { saveMediaBuffer } from "./store.js";

export async function resolveOutboundAttachmentFromUrl(
  mediaUrl: string,
  maxBytes: number,
  options?: { localRoots?: readonly string[] },
): Promise<{ path: string; contentType?: string }> {
  const media = await loadMedia(mediaUrl, {
    maxBytes,
    localRoots: options?.localRoots as string[] | undefined,
  });
  const saved = await saveMediaBuffer(
    media.buffer,
    media.contentType ?? undefined,
    "outbound",
    maxBytes,
  );
  return { path: saved.path, contentType: saved.contentType };
}
