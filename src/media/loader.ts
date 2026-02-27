import fs from "node:fs/promises";
import path from "node:path";
import { fetchRemoteMedia } from "./fetch.js";
import { detectMime } from "./mime.js";

export type MediaResult = {
  buffer: Buffer;
  contentType: string;
  kind: "image" | "audio" | "video" | "document" | "unknown";
  fileName?: string;
};

export function resolveKindFromMime(mime?: string): MediaResult["kind"] {
  if (!mime) return "unknown";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("application/pdf")) return "document";
  return "unknown";
}

export type LoadMediaOptions = {
  localRoots?: string[];
  maxBytes?: number;
};

/**
 * Universal media loader replacing the legacy loadWebMedia.
 * Supports: data: URLs, http(s): URLs, and local file paths.
 */
export async function loadMedia(
  urlOrPath: string,
  options?: LoadMediaOptions,
): Promise<MediaResult> {
  const localRoots = options?.localRoots ?? [];
  const maxBytes = options?.maxBytes;

  // 1. Data URLs
  if (urlOrPath.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(urlOrPath);
    if (!match) throw new Error("Invalid data URL");
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (maxBytes && buffer.length > maxBytes) {
      throw new Error(`Data URL payload ${buffer.length} exceeds maxBytes ${maxBytes}`);
    }
    return {
      buffer,
      contentType,
      kind: resolveKindFromMime(contentType),
    };
  }

  // 2. Web URLs
  if (/^https?:\/\//i.test(urlOrPath)) {
    const result = await fetchRemoteMedia({ url: urlOrPath, maxBytes });
    const contentType = result.contentType ?? "application/octet-stream";
    return {
      buffer: result.buffer,
      contentType,
      kind: resolveKindFromMime(contentType),
      fileName: result.fileName,
    };
  }

  // 3. Local Files
  let absolutePath = urlOrPath;
  if (!path.isAbsolute(urlOrPath)) {
    let found = false;
    for (const root of localRoots) {
      const candidate = path.resolve(root, urlOrPath);
      try {
        await fs.access(candidate);
        absolutePath = candidate;
        found = true;
        break;
      } catch {
        continue;
      }
    }
    if (!found) {
      // Try resolving against CWD as a last resort
      absolutePath = path.resolve(urlOrPath);
    }
  }

  const stat = await fs.stat(absolutePath);
  if (maxBytes && stat.size > maxBytes) {
    throw new Error(`File ${absolutePath} size ${stat.size} exceeds maxBytes ${maxBytes}`);
  }

  const buffer = await fs.readFile(absolutePath);
  const contentType = (await detectMime({ buffer, filePath: absolutePath })) ?? "application/octet-stream";
  return {
    buffer,
    contentType,
    kind: resolveKindFromMime(contentType),
    fileName: path.basename(absolutePath),
  };
}
