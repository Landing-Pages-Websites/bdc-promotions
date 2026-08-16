import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Minimal image header reader. Dimensions, bytes and digest are facts about the
 * committed file, so they are safe to migrate automatically; anything this
 * cannot read is reported rather than assumed.
 */

export type ImageMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export interface ProbedImage {
  readonly mimeType: ImageMimeType;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
  readonly sha256: string;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

interface Dimensions {
  readonly width: number;
  readonly height: number;
}

function readPng(buffer: Buffer): Dimensions | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readJpeg(buffer: Buffer): Dimensions | null {
  if (buffer.length < 4 || buffer.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker !== undefined && SOF_MARKERS.has(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function readWebpChunk(buffer: Buffer, chunk: string, offset: number): Dimensions | null {
  if (chunk === "VP8X") {
    return {
      width: buffer.readUIntLE(offset + 4, 3) + 1,
      height: buffer.readUIntLE(offset + 7, 3) + 1,
    };
  }
  if (chunk === "VP8 ") {
    return {
      width: buffer.readUInt16LE(offset + 6) & 0x3fff,
      height: buffer.readUInt16LE(offset + 8) & 0x3fff,
    };
  }
  if (chunk !== "VP8L") return null;
  const bits = buffer.readUInt32LE(offset + 1);
  return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
}

function readWebp(buffer: Buffer): Dimensions | null {
  if (buffer.length < 30) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  return readWebpChunk(buffer, buffer.toString("ascii", 12, 16), 20);
}

const READERS: readonly (readonly [ImageMimeType, (buffer: Buffer) => Dimensions | null])[] = [
  ["image/png", readPng],
  ["image/webp", readWebp],
  ["image/jpeg", readJpeg],
];

export function probeImage(absolutePath: string): ProbedImage | null {
  let buffer: Buffer;
  try {
    buffer = readFileSync(absolutePath);
  } catch {
    return null;
  }
  for (const [mimeType, reader] of READERS) {
    const dimensions = reader(buffer);
    if (dimensions === null) continue;
    if (dimensions.width <= 0 || dimensions.height <= 0) return null;
    return {
      mimeType,
      width: dimensions.width,
      height: dimensions.height,
      bytes: buffer.byteLength,
      sha256: createHash("sha256").update(buffer).digest("hex"),
    };
  }
  return null;
}

function greatestCommonDivisor(left: number, right: number): number {
  return right === 0 ? left : greatestCommonDivisor(right, left % right);
}

export function aspectRatioOf(image: ProbedImage): { readonly width: number; readonly height: number } {
  const divisor = greatestCommonDivisor(image.width, image.height);
  return { width: image.width / divisor, height: image.height / divisor };
}
