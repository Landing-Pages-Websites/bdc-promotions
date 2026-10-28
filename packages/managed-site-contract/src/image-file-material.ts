import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";

import { ManagedSiteContractError } from "./errors.js";

/**
 * What an image file's own bytes say about it, as a browser shows it: its
 * format, its displayed size, its length and its digest. An image value and an
 * asset manifest entry state the same five things, so this is what they are
 * checked against wherever the file itself can be read.
 *
 * Displayed size, not stored size: a JPEG whose EXIF orientation is 5 to 8
 * stores its frame with the axes swapped, and every browser shows it rotated
 * (`image-orientation: from-image` is the default), so a 1500x1125 frame with
 * orientation 6 is a 1125x1500 picture.
 *
 * It derives only what every browser agrees on, and refuses everything else
 * (`IMAGE_FILE_UNDERIVABLE`): an unrecognized or truncated file (a JPEG
 * with no end of image after its scan included), one a
 * decoder rejects (a second SOI, a WebP canvas its frame does not fill, a PNG
 * dimension past 2^31-1), a frame of unknown height, two frames, an EXIF block
 * Chrome and Firefox read differently (not the first APP1, a non-zero pad
 * byte, two of them, an orientation entry cut short), an orientation outside
 * 1-8, a PNG or WebP carrying EXIF, an animated WebP, and AVIF (its rotation
 * lives in container boxes this does not read). A refusal is never a guess.
 *
 * Every container byte is accounted for: a JPEG ends at its end of image, a
 * PNG follows the chunk grammar and its one zlib stream inflates to exactly
 * its scanlines and ends where its image data does, a WebP's RIFF ends the
 * file. Entropy-coded pixels (JPEG scans, VP8/VP8L bitstreams) are not
 * decoded: damage there changes no size a browser shows, and decoders do not
 * agree on how much of it they tolerate.
 */
export interface ManagedImageFileMaterial {
  readonly mimeType: "image/jpeg" | "image/png" | "image/webp";
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
  readonly sha256: string;
}

interface DisplayedFrame {
  readonly mimeType: ManagedImageFileMaterial["mimeType"];
  readonly width: number;
  readonly height: number;
}

const FIRST_AXIS_SWAPPING_ORIENTATION = 5;
const MAX_ORIENTATION = 8;

function underivable(reason: string): never {
  throw new ManagedSiteContractError("IMAGE_FILE_UNDERIVABLE", `Image file material cannot be derived: ${reason}`);
}

/** Reads within the file or refuses: a truncated file is never read past its end. */
class Bytes {
  public constructor(private readonly data: Uint8Array) {}

  public get length(): number {
    return this.data.length;
  }

  public slice(start: number, end: number): Uint8Array {
    if (start < 0 || end > this.data.length || start > end) underivable("truncated file");
    return this.data.subarray(start, end);
  }

  public u8(offset: number): number {
    if (!Number.isInteger(offset) || offset < 0 || offset >= this.data.length) underivable("truncated file");
    return this.data[offset]!;
  }

  public u16be(offset: number): number {
    return (this.u8(offset) << 8) | this.u8(offset + 1);
  }

  public u16le(offset: number): number {
    return this.u8(offset) | (this.u8(offset + 1) << 8);
  }

  public u24le(offset: number): number {
    return this.u16le(offset) | (this.u8(offset + 2) << 16);
  }

  public u32be(offset: number): number {
    return this.u16be(offset) * 0x10000 + this.u16be(offset + 2);
  }

  public u32le(offset: number): number {
    return this.u16le(offset) + this.u16le(offset + 2) * 0x10000;
  }

  public ascii(offset: number, length: number): string {
    let text = "";
    for (let index = 0; index < length; index += 1) text += String.fromCharCode(this.u8(offset + index));
    return text;
  }

  public startsWith(signature: readonly number[], offset = 0): boolean {
    return (
      offset + signature.length <= this.data.length &&
      signature.every((byte, index) => this.data[offset + index] === byte)
    );
  }
}

function positiveSize(width: number, height: number): void {
  if (width <= 0 || height <= 0) underivable("a frame of zero width or height");
}

// ---------------------------------------------------------------- JPEG

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const JPEG_SOS = 0xda;
const JPEG_EOI = 0xd9;
const JPEG_APP1 = 0xe1;
const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] as const;
/** "Exif": an APP1 so marked is an EXIF block to some browser, whatever follows. */
const EXIF_MARK = EXIF_HEADER.slice(0, 4);
const IFD_ENTRY_LENGTH = 12;
const JPEG_SOI = 0xd8;
const EXIF_ORIENTATION_TAG = 0x0112;
const TIFF_SHORT = 3;

/** A marker with no length: TEM and RSTn (a second SOI is refused). */
function isStandaloneMarker(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7);
}

/** Start of frame: C0-CF less DHT (C4), JPG (C8) and DAC (CC). */
function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

/** The orientation an EXIF block's first IFD states, 1 when it states none. */
function exifOrientation(file: Bytes, start: number, end: number): number {
  const tiff = start + EXIF_HEADER.length;
  const order = file.ascii(tiff, 2);
  if (order !== "II" && order !== "MM") underivable("an EXIF block with no byte order");
  const little = order === "II";
  const u16 = (offset: number): number => {
    if (offset + 2 > end) underivable("an EXIF block read past its end");
    return little ? file.u16le(offset) : file.u16be(offset);
  };
  const u32 = (offset: number): number => {
    if (offset + 4 > end) underivable("an EXIF block read past its end");
    return little ? file.u32le(offset) : file.u32be(offset);
  };
  if (u16(tiff + 2) !== 42) underivable("an EXIF block that is not TIFF");
  const ifd = tiff + u32(tiff + 4);
  const count = u16(ifd);
  let orientation: number | null = null;
  for (let index = 0; index < count; index += 1) {
    const entry = ifd + 2 + index * IFD_ENTRY_LENGTH;
    // Chrome ignores an entry the block cuts short; Firefox reads it.
    if (entry + IFD_ENTRY_LENGTH > end) underivable("an EXIF entry cut short");
    if (u16(entry) !== EXIF_ORIENTATION_TAG) continue;
    if (orientation !== null) underivable("two EXIF orientations");
    if (u16(entry + 2) !== TIFF_SHORT || u32(entry + 4) !== 1) underivable("an EXIF orientation that is not one SHORT");
    orientation = u16(entry + 8);
  }
  if (orientation === null) return 1;
  if (orientation < 1 || orientation > MAX_ORIENTATION) underivable(`EXIF orientation ${orientation}`);
  return orientation;
}

/**
 * Whether the image ends, walked from the first scan's data: entropy-coded
 * bytes (where FF is always stuffed as FF 00 or a restart marker FF D0-D7),
 * then any segment between scans (a progressive file's DHT and SOS, read by
 * its length, so FF D9 inside its payload is never mistaken for the end),
 * until an EOI marker. A file that runs out first is cut off.
 */
function endsImageAfter(file: Bytes, scanData: number): boolean {
  let offset = scanData;
  while (offset + 1 < file.length) {
    if (file.u8(offset) !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = file.u8(offset + 1);
    if (marker === 0x00 || marker === 0xff || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += marker === 0xff ? 1 : 2;
      continue;
    }
    // The end of image ends the file: bytes after it are no part of the
    // picture, and a file that carries them is not one unambiguous image.
    if (marker === JPEG_EOI) return offset + 2 === file.length;
    if (marker === JPEG_SOI || isStandaloneMarker(marker)) return false;
    // A segment between scans: skip its payload by its length.
    if (offset + 4 > file.length) return false;
    const length = file.u16be(offset + 2);
    if (length < 2) return false;
    offset += 2 + length;
  }
  return false;
}

function jpegFrame(file: Bytes): DisplayedFrame {
  let offset = 2;
  let orientation: number | null = null;
  let firstApp1 = true;
  let frame: { width: number; height: number } | null = null;
  for (;;) {
    if (file.u8(offset) !== 0xff) underivable("a JPEG segment that does not start with a marker");
    while (file.u8(offset) === 0xff) offset += 1;
    const marker = file.u8(offset);
    offset += 1;
    if (isStandaloneMarker(marker)) continue;
    if (marker === JPEG_SOI) underivable("a second start of image");
    if (marker === JPEG_EOI) underivable("a JPEG that ends before its scan");
    const length = file.u16be(offset);
    if (length < 2) underivable("a JPEG segment shorter than its length field");
    const end = offset + length;
    if (end > file.length) underivable("truncated file");
    if (marker === JPEG_SOS) {
      // A file cut off inside its scans still states its size in its header,
      // but no decoder finishes it: refuse it rather than size it.
      if (!endsImageAfter(file, end)) underivable("a JPEG with no end of image after its scan");
      break;
    }
    if (marker === JPEG_APP1) {
      // Firefox reads only the first APP1 and needs `Exif\0\0`; Chrome reads
      // any APP1 marked `Exif` and skips the pad byte. They agree only on one
      // exact block that is the first APP1.
      if (file.startsWith(EXIF_MARK, offset + 2)) {
        if (!firstApp1) underivable("an EXIF block that is not the first APP1");
        if (!file.startsWith(EXIF_HEADER, offset + 2)) underivable("an EXIF block with a non-zero pad byte");
        orientation = exifOrientation(file, offset + 2, end);
      }
      firstApp1 = false;
    }
    if (isStartOfFrame(marker)) {
      if (frame !== null) underivable("two JPEG frames");
      if (offset + 8 > end) underivable("a JPEG frame header shorter than a frame");
      // Precision, height, width, then three bytes per component: a frame
      // with no component, or a length that is not that, no decoder reads.
      const components = file.u8(offset + 7);
      if (components === 0 || end - offset !== 8 + 3 * components) underivable("a JPEG frame header no decoder reads");
      frame = { height: file.u16be(offset + 3), width: file.u16be(offset + 5) };
    }
    offset = end;
  }
  if (frame === null) return underivable("a JPEG with no frame before its scan");
  positiveSize(frame.width, frame.height);
  const swapped = (orientation ?? 1) >= FIRST_AXIS_SWAPPING_ORIENTATION;
  return {
    mimeType: "image/jpeg",
    width: swapped ? frame.height : frame.width,
    height: swapped ? frame.width : frame.height,
  };
}

// ---------------------------------------------------------------- PNG

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const PNG_IHDR_LENGTH = 13;
const PNG_MAX_DIMENSION = 0x7fffffff;
/** Chunk length, type and CRC around each chunk's data. */
const PNG_CHUNK_OVERHEAD = 12;

/**
 * The bit depths each PNG colour type admits (PNG 1.2, 11.2.2): any other
 * pairing is a header every decoder refuses.
 */
const PNG_BIT_DEPTHS: ReadonlyMap<number, readonly number[]> = new Map([
  [0, [1, 2, 4, 8, 16]],
  [2, [8, 16]],
  [3, [1, 2, 4, 8]],
  [4, [8, 16]],
  [6, [8, 16]],
]);

/** Samples per pixel of each colour type. */
const PNG_CHANNELS: ReadonlyMap<number, number> = new Map([
  [0, 1],
  [2, 3],
  [3, 1],
  [4, 2],
  [6, 4],
]);
/** The most decompressed image data the derivation will inflate to verify. */
const PNG_MAX_IMAGE_DATA_BYTES = 256 * 1024 * 1024;
/** Adam7's seven passes: x and y start and step. */
const ADAM7: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
];

/** Each reduced image's (width, height): one for a plain PNG, seven for Adam7. */
function pngPasses(width: number, height: number, interlaced: boolean): readonly (readonly [number, number])[] {
  if (!interlaced) return [[width, height]];
  return ADAM7.map(([x, y, dx, dy]) => [Math.ceil(Math.max(0, width - x) / dx), Math.ceil(Math.max(0, height - y) / dy)] as const);
}

/**
 * The image data inflates (zlib) to exactly the scanlines the header states,
 * each led by a filter type 0 to 4: what a decoder needs to draw every row.
 * Pixel values themselves are any bytes, so this is a whole decode short of
 * unfiltering.
 */
function assertPngImageData(
  chunks: readonly Uint8Array[],
  header: { readonly width: number; readonly height: number; readonly bitDepth: number; readonly colourType: number; readonly interlaced: boolean },
): void {
  if (chunks.length === 0) underivable("a PNG with no image data");
  const bitsPerPixel = (PNG_CHANNELS.get(header.colourType) ?? 0) * header.bitDepth;
  const passes = pngPasses(header.width, header.height, header.interlaced).filter(([w, h]) => w > 0 && h > 0);
  const rowBytes = passes.map(([w]) => 1 + Math.ceil((w * bitsPerPixel) / 8));
  const expected = passes.reduce((total, [, h], index) => total + h * rowBytes[index]!, 0);
  if (expected > PNG_MAX_IMAGE_DATA_BYTES) underivable("a PNG too large to verify");
  let inflated: Uint8Array;
  try {
    const joined = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
    let at = 0;
    for (const chunk of chunks) {
      joined.set(chunk, at);
      at += chunk.length;
    }
    const result = inflateSync(joined, { maxOutputLength: expected + 1, info: true }) as unknown as {
      readonly buffer: Uint8Array;
      readonly engine: { readonly bytesWritten: number };
    };
    // One zlib stream that ends exactly where the image data does: bytes
    // after it are nothing a decoder reads.
    if (result.engine.bytesWritten !== joined.length) underivable("a PNG with bytes after its compressed image data");
    inflated = result.buffer;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) throw error;
    return underivable("a PNG whose image data does not inflate");
  }
  if (inflated.length !== expected) underivable("a PNG whose image data is not its scanlines");
  let at = 0;
  passes.forEach(([, h], index) => {
    for (let row = 0; row < h; row += 1) {
      if (inflated[at]! > 4) underivable("a PNG scanline with an unknown filter");
      at += rowBytes[index]!;
    }
  });
}

const PNG_CHUNK_TYPE = /^[A-Za-z]{2}[A-Z][A-Za-z]$/;
const PNG_KNOWN_CRITICAL = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);

/**
 * The PNG chunk grammar a decoder enforces (PNG 1.2, 3.3 and 4.1): a chunk
 * type is four letters with the reserved bit clear; a critical chunk (upper
 * case first letter) a decoder does not know makes it refuse the file; the
 * header occurs once; the palette occurs at most once and before the image
 * data.
 */
function assertPngChunkPlace(
  type: string,
  seen: { readonly previous: string; readonly palette: boolean; readonly imageData: boolean },
): void {
  if (!PNG_CHUNK_TYPE.test(type)) underivable("a PNG chunk type no decoder reads");
  const critical = type[0] === type[0]!.toUpperCase();
  if (critical && !PNG_KNOWN_CRITICAL.has(type)) underivable(`a PNG with the unknown critical chunk ${type}`);
  if (type === "IHDR" && seen.previous !== "") underivable("a PNG with a second header");
  if (type === "PLTE" && (seen.palette || seen.imageData)) underivable("a PNG palette repeated or after its image data");
}

let crcTable: Uint32Array | null = null;

function pngCrc(file: Bytes, start: number, end: number): number {
  if (crcTable === null) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let index = start; index < end; index += 1) crc = crcTable[(crc ^ file.u8(index)) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * A PNG every decoder reads: its header first and well formed (a colour type
 * and bit depth that pair, deflate, adaptive filtering, no or Adam7
 * interlacing), every chunk's CRC right, image data present, and an empty
 * end chunk last. Its pixels are not decoded; the file is bound to the
 * digest of the one production serves.
 */
function pngFrame(file: Bytes): DisplayedFrame {
  let offset: number = PNG_SIGNATURE.length;
  if (file.u32be(offset) !== PNG_IHDR_LENGTH || file.ascii(offset + 4, 4) !== "IHDR") {
    underivable("a PNG whose first chunk is not its header");
  }
  const width = file.u32be(offset + 8);
  const height = file.u32be(offset + 12);
  if (width > PNG_MAX_DIMENSION || height > PNG_MAX_DIMENSION) underivable("a PNG dimension past 2^31-1");
  const [bitDepth, colourType, compression, filter, interlace] = [16, 17, 18, 19, 20].map((at) => file.u8(offset + at));
  if (
    !(PNG_BIT_DEPTHS.get(colourType!) ?? []).includes(bitDepth!) ||
    compression !== 0 ||
    filter !== 0 ||
    (interlace !== 0 && interlace !== 1)
  ) {
    underivable("a PNG header no decoder reads");
  }
  const imageData: Uint8Array[] = [];
  let previous = "";
  let palette = false;
  for (;;) {
    const length = file.u32be(offset);
    const type = file.ascii(offset + 4, 4);
    const next = offset + PNG_CHUNK_OVERHEAD + length;
    if (length > PNG_MAX_DIMENSION) underivable("a PNG chunk longer than 2^31-1");
    if (next > file.length) underivable("truncated file");
    if (pngCrc(file, offset + 4, next - 4) !== file.u32be(next - 4)) underivable(`a PNG ${type} chunk whose CRC is wrong`);
    assertPngChunkPlace(type, { previous, palette, imageData: imageData.length > 0 });
    if (type === "eXIf") underivable("a PNG carrying EXIF");
    if (type === "PLTE") palette = true;
    if (type === "IDAT") {
      // Image data is one run of consecutive IDAT chunks.
      if (imageData.length > 0 && previous !== "IDAT") underivable("a PNG whose image data is split");
      imageData.push(file.slice(offset + 8, next - 4));
    }
    if (type === "IEND") {
      // The end chunk is empty and ends the file.
      if (length !== 0 || next !== file.length) underivable("a PNG with a malformed end or bytes after it");
      break;
    }
    previous = type;
    offset = next;
  }
  positiveSize(width, height);
  if (colourType === 3 && !palette) underivable("a palette PNG with no palette");
  assertPngImageData(imageData, { width, height, bitDepth: bitDepth!, colourType: colourType!, interlaced: interlace === 1 });
  return { mimeType: "image/png", width, height };
}

// ---------------------------------------------------------------- WebP

const RIFF_HEADER_LENGTH = 12;
const RIFF_CHUNK_HEADER_LENGTH = 8;
const VP8X_EXIF_FLAG = 0x08;
const VP8X_ANIMATION_FLAG = 0x02;
const VP8X_LENGTH = 10;
const VP8_START_CODE = [0x9d, 0x01, 0x2a] as const;
const VP8L_SIGNATURE = 0x2f;
const FOURTEEN_BITS = 0x3fff;

interface RiffChunk {
  readonly type: string;
  readonly data: number;
  readonly length: number;
}

function riffChunks(file: Bytes): readonly RiffChunk[] {
  const riffEnd = RIFF_CHUNK_HEADER_LENGTH + file.u32le(4);
  if (riffEnd > file.length) underivable("truncated file");
  if (riffEnd !== file.length) underivable("a WebP with bytes after its container");
  const chunks: RiffChunk[] = [];
  let offset = RIFF_HEADER_LENGTH;
  while (offset < riffEnd) {
    const length = file.u32le(offset + 4);
    const data = offset + RIFF_CHUNK_HEADER_LENGTH;
    if (data + length > riffEnd) underivable("truncated file");
    chunks.push({ type: file.ascii(offset, 4), data, length });
    // Chunks are padded to an even length.
    offset = data + length + (length % 2);
  }
  return chunks;
}

/** A VP8 key frame's header: frame tag (3), start code (3), sizes (4). */
const VP8_KEY_FRAME_HEADER_LENGTH = 10;
/** A VP8L header: signature (1), sizes and version (4). */
const VP8L_HEADER_LENGTH = 5;

function webpBitstream(file: Bytes, chunk: RiffChunk): { width: number; height: number } {
  if (chunk.type === "VP8 ") {
    // A still WebP's frame is a key frame (bit 0 of its tag clear); only a key
    // frame states its size.
    if (chunk.length < VP8_KEY_FRAME_HEADER_LENGTH || (file.u8(chunk.data) & 1) !== 0) {
      underivable("a VP8 frame that is not a key frame");
    }
    if (!file.startsWith(VP8_START_CODE, chunk.data + 3)) underivable("a VP8 frame with no start code");
    return { width: file.u16le(chunk.data + 6) & FOURTEEN_BITS, height: file.u16le(chunk.data + 8) & FOURTEEN_BITS };
  }
  if (chunk.length < VP8L_HEADER_LENGTH || file.u8(chunk.data) !== VP8L_SIGNATURE) {
    underivable("a VP8L frame with no signature");
  }
  const bits = file.u32le(chunk.data + 1);
  // The top three bits are the version, which must be 0.
  if (bits >>> 29 !== 0) underivable("a VP8L frame of an unknown version");
  return { width: (bits & FOURTEEN_BITS) + 1, height: ((bits >>> 14) & FOURTEEN_BITS) + 1 };
}

function webpFrame(file: Bytes): DisplayedFrame {
  const chunks = riffChunks(file);
  if (chunks.some(({ type }) => type === "EXIF")) underivable("a WebP carrying EXIF");
  const first = chunks[0];
  if (first === undefined) return underivable("a WebP with no chunk");
  if (first.type === "VP8X") {
    if (first.length < VP8X_LENGTH) underivable("a VP8X chunk shorter than its header");
    const flags = file.u8(first.data);
    if ((flags & VP8X_EXIF_FLAG) !== 0) underivable("a WebP carrying EXIF");
    if ((flags & VP8X_ANIMATION_FLAG) !== 0) underivable("an animated WebP");
    const width = file.u24le(first.data + 4) + 1;
    const height = file.u24le(first.data + 7) + 1;
    // libwebp refuses a still image whose frame does not fill its canvas.
    const frames = chunks.filter(({ type }) => type === "VP8 " || type === "VP8L");
    if (frames.length !== 1) underivable("an extended WebP without exactly one frame");
    const frame = webpBitstream(file, frames[0]!);
    if (frame.width !== width || frame.height !== height) underivable("a WebP canvas its frame does not fill");
    return { mimeType: "image/webp", width, height };
  }
  if (first.type !== "VP8 " && first.type !== "VP8L") underivable("a WebP whose first chunk is not a frame");
  // A simple WebP is its one frame chunk and nothing else.
  if (chunks.length !== 1) underivable("a simple WebP with more than its one frame");
  const { width, height } = webpBitstream(file, first);
  positiveSize(width, height);
  return { mimeType: "image/webp", width, height };
}

// ---------------------------------------------------------------- dispatch

function isWebp(file: Bytes): boolean {
  return file.length >= RIFF_HEADER_LENGTH && file.ascii(0, 4) === "RIFF" && file.ascii(8, 4) === "WEBP";
}

function displayedFrame(file: Bytes): DisplayedFrame {
  if (file.startsWith(JPEG_SIGNATURE)) return jpegFrame(file);
  if (file.startsWith(PNG_SIGNATURE)) return pngFrame(file);
  if (isWebp(file)) return webpFrame(file);
  return underivable("not a JPEG, PNG or WebP file");
}

/**
 * The material of one image file, from its bytes alone. Throws
 * `IMAGE_FILE_UNDERIVABLE` for anything it cannot be sure of.
 */
export function managedImageFileMaterialV1(bytes: Uint8Array): ManagedImageFileMaterial {
  if (!(bytes instanceof Uint8Array)) underivable("not bytes");
  const frame = displayedFrame(new Bytes(bytes));
  return Object.freeze({
    mimeType: frame.mimeType,
    width: frame.width,
    height: frame.height,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
