import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { managedImageFileMaterialV1, ManagedSiteContractError } from "../src/index.js";

/**
 * 0.42.0: an image file's material as a browser shows it, from its bytes
 * alone. Invariant: the derivation returns the displayed size (EXIF
 * orientation 5-8 swaps the axes), the sniffed format, the length and the
 * digest, or refuses with `IMAGE_FILE_UNDERIVABLE`; it never returns a size it
 * is not sure of, and never fails any other way.
 *
 * The fixtures were written by sharp, and `sharp-metadata.json` is what sharp
 * reads back from each (its displayed size swaps the axes for orientation 5-8,
 * exactly as the platform's upload pipeline does), so every supported fixture
 * is a parity check against the decoder the platform uses.
 */

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/image-material");

interface SharpReading {
  readonly format: string;
  readonly displayedWidth: number;
  readonly displayedHeight: number;
  readonly bytes: number;
}

const SHARP = JSON.parse(readFileSync(resolve(FIXTURES, "sharp-metadata.json"), "utf8")) as Record<string, SharpReading>;
const MIME_BY_SHARP_FORMAT: Readonly<Record<string, string>> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
/** Fixtures the derivation must refuse though sharp reads them: their display is not certain. */
const REFUSED = new Set(["webp-exif-orientation-6.webp", "avif-plain.avif"]);

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(FIXTURES, name)));
}

function refusal(bytes: Uint8Array): string {
  try {
    const material = managedImageFileMaterialV1(bytes);
    return `derived ${material.width}x${material.height}`;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

describe("parity with sharp over every fixture it wrote", () => {
  for (const [name, reading] of Object.entries(SHARP)) {
    it(`${name}: ${REFUSED.has(name) ? "refused" : `${reading.displayedWidth}x${reading.displayedHeight}`}`, () => {
      const bytes = fixture(name);
      if (REFUSED.has(name)) {
        assert.equal(refusal(bytes), "IMAGE_FILE_UNDERIVABLE");
        return;
      }
      assert.deepEqual(managedImageFileMaterialV1(bytes), {
        mimeType: MIME_BY_SHARP_FORMAT[reading.format],
        width: reading.displayedWidth,
        height: reading.displayedHeight,
        bytes: reading.bytes,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    });
  }

  it("covers every orientation that swaps and one that does not", () => {
    const swapped = Object.entries(SHARP).filter(([, reading]) => reading.displayedWidth === 30).map(([name]) => name);
    assert.deepEqual(
      swapped.sort(),
      [
        "jpeg-orientation-5.jpg",
        "jpeg-orientation-6.jpg",
        "jpeg-orientation-7.jpg",
        "jpeg-orientation-8.jpg",
        "jpeg-progressive-orientation-6.jpg",
        "webp-exif-orientation-6.webp",
      ],
    );
  });
});

// ------------------------------------------------------------ hand-built files

function u16be(value: number): number[] {
  return [(value >> 8) & 0xff, value & 0xff];
}

function u16le(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff];
}

function u32be(value: number): number[] {
  return [...u16be(Math.floor(value / 0x10000)), ...u16be(value & 0xffff)];
}

function u32le(value: number): number[] {
  return [...u16le(value & 0xffff), ...u16le(Math.floor(value / 0x10000))];
}

interface OrientationEntry {
  readonly tag?: number;
  readonly type?: number;
  readonly count?: number;
  readonly value: number;
}

/** A TIFF block with one IFD of the given entries. */
function tiff(order: "II" | "MM", entries: readonly OrientationEntry[]): number[] {
  const u16 = order === "II" ? u16le : u16be;
  const u32 = order === "II" ? u32le : u32be;
  const body = entries.flatMap(({ tag = 0x0112, type = 3, count = 1, value }) => [
    ...u16(tag),
    ...u16(type),
    ...u32(count),
    ...u16(value),
    0,
    0,
  ]);
  return [...order.split("").map((char) => char.charCodeAt(0)), ...u16(42), ...u32(8), ...u16(entries.length), ...body, ...u32(0)];
}

function segment(marker: number, payload: readonly number[]): number[] {
  return [0xff, marker, ...u16be(payload.length + 2), ...payload];
}

const EXIF = [0x45, 0x78, 0x69, 0x66, 0, 0];

function app1(order: "II" | "MM", entries: readonly OrientationEntry[]): number[] {
  return segment(0xe1, [...EXIF, ...tiff(order, entries)]);
}

function sof(marker: number, width: number, height: number): number[] {
  return segment(marker, [8, ...u16be(height), ...u16be(width), 1, 1, 0x11, 0]);
}

const SOS = segment(0xda, [1, 1, 0, 0, 63, 0]);

function jpeg(...segments: number[][]): Uint8Array {
  return new Uint8Array([0xff, 0xd8, ...segments.flat(), ...SOS, 0x00, 0xff, 0xd9]);
}

function derived(bytes: Uint8Array): string {
  const material = managedImageFileMaterialV1(bytes);
  return `${material.mimeType} ${material.width}x${material.height}`;
}

describe("JPEG: the displayed size", () => {
  const cases: ReadonlyArray<readonly [string, Uint8Array, string]> = [
    ["no EXIF", jpeg(sof(0xc0, 40, 30)), "image/jpeg 40x30"],
    ["little-endian orientation 6", jpeg(app1("II", [{ value: 6 }]), sof(0xc0, 40, 30)), "image/jpeg 30x40"],
    ["big-endian orientation 6", jpeg(app1("MM", [{ value: 6 }]), sof(0xc0, 40, 30)), "image/jpeg 30x40"],
    ["big-endian orientation 8", jpeg(app1("MM", [{ value: 8 }]), sof(0xc0, 40, 30)), "image/jpeg 30x40"],
    ["orientation 3 does not swap", jpeg(app1("II", [{ value: 3 }]), sof(0xc0, 40, 30)), "image/jpeg 40x30"],
    ["orientation 4 does not swap", jpeg(app1("II", [{ value: 4 }]), sof(0xc0, 40, 30)), "image/jpeg 40x30"],
    ["orientation among other tags", jpeg(app1("II", [{ tag: 0x010f, type: 2, count: 2, value: 0 }, { value: 6 }]), sof(0xc0, 40, 30)), "image/jpeg 30x40"],
    ["EXIF after the frame header", jpeg(sof(0xc0, 40, 30), app1("II", [{ value: 6 }])), "image/jpeg 30x40"],
    ["progressive frame (SOF2)", jpeg(app1("II", [{ value: 6 }]), sof(0xc2, 40, 30)), "image/jpeg 30x40"],
    ["fill bytes before a marker", new Uint8Array([0xff, 0xd8, 0xff, 0xff, ...sof(0xc0, 40, 30).slice(1), ...SOS, 0xff, 0xd9]), "image/jpeg 40x30"],
    ["an APP1 that is XMP, not EXIF", jpeg(segment(0xe1, [0x68, 0x74, 0x74, 0x70]), sof(0xc0, 40, 30)), "image/jpeg 40x30"],
    ["a progressive file with a table between its scans", new Uint8Array([0xff, 0xd8, ...sof(0xc2, 40, 30), ...SOS, 0x12, 0xff, 0x00, 0x34, 0xff, 0xd3, ...segment(0xc4, [0x00, 0xff, 0xd9]), ...SOS, 0x56, 0xff, 0xd9]), "image/jpeg 40x30"],
    ["a DHT segment (C4) is not a frame", jpeg(segment(0xc4, [0, 0, 0]), sof(0xc0, 40, 30)), "image/jpeg 40x30"],
  ];
  for (const [name, bytes, expected] of cases) it(name, () => assert.equal(derived(bytes), expected));
});

describe("refuses what it cannot be sure of", () => {
  const png = fixture("png-plain.png");
  const cases: ReadonlyArray<readonly [string, Uint8Array]> = [
    ["empty", new Uint8Array()],
    ["not an image", new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")],
    ["a GIF", new TextEncoder().encode("GIF89a\x28\x00\x1e\x00")],
    ["AVIF", fixture("avif-plain.avif")],
    ["JPEG: two EXIF blocks", jpeg(app1("II", [{ value: 1 }]), app1("II", [{ value: 6 }]), sof(0xc0, 40, 30))],
    ["JPEG: EXIF after an XMP APP1 (Firefox reads only the first APP1)", jpeg(segment(0xe1, [0x68, 0x74, 0x74, 0x70]), app1("II", [{ value: 6 }]), sof(0xc0, 40, 30))],
    ["JPEG: EXIF with a non-zero pad byte (Chrome reads it, Firefox does not)", jpeg(segment(0xe1, [0x45, 0x78, 0x69, 0x66, 0, 0xff, ...tiff("II", [{ value: 6 }])]), sof(0xc0, 40, 30))],
    ["JPEG: an orientation entry the block cuts short", jpeg(segment(0xe1, [...EXIF, ...tiff("II", [{ value: 6 }]).slice(0, 8 + 2 + 10)]), sof(0xc0, 40, 30))],
    ["JPEG: a second start of image", new Uint8Array([0xff, 0xd8, 0xff, 0xd8, ...sof(0xc0, 40, 30), ...SOS])],
    ["PNG: a width past 2^31-1", (() => { const copy = fixture("png-plain.png").slice(); copy[16] = 0x80; return copy; })()],
    ["WebP: a canvas its frame does not fill", webpVp8x(0x10, 99, 99)],
    ["WebP: a VP8X chunk too short", (() => { const copy = webpVp8x(0x10).slice(); copy[16] = 4; return copy; })()],
    ["JPEG: two orientations in one block", jpeg(app1("II", [{ value: 1 }, { value: 6 }]), sof(0xc0, 40, 30))],
    ["JPEG: orientation 0", jpeg(app1("II", [{ value: 0 }]), sof(0xc0, 40, 30))],
    ["JPEG: orientation 9", jpeg(app1("II", [{ value: 9 }]), sof(0xc0, 40, 30))],
    ["JPEG: orientation as a LONG", jpeg(app1("II", [{ type: 4, value: 6 }]), sof(0xc0, 40, 30))],
    ["JPEG: orientation with count 2", jpeg(app1("II", [{ count: 2, value: 6 }]), sof(0xc0, 40, 30))],
    ["JPEG: EXIF with no byte order", jpeg(segment(0xe1, [...EXIF, 0x58, 0x58, 0, 42]), sof(0xc0, 40, 30))],
    ["JPEG: EXIF that is not TIFF", jpeg(segment(0xe1, [...EXIF, 0x49, 0x49, 43, 0, 8, 0, 0, 0]), sof(0xc0, 40, 30))],
    ["JPEG: IFD offset past the block", jpeg(segment(0xe1, [...EXIF, 0x49, 0x49, 42, 0, 0xff, 0, 0, 0]), sof(0xc0, 40, 30))],
    ["JPEG: two frames", jpeg(sof(0xc0, 40, 30), sof(0xc2, 30, 40))],
    ["JPEG: no frame before the scan", jpeg()],
    ["JPEG: height 0 (set later by DNL)", jpeg(sof(0xc0, 40, 0))],
    ["JPEG: width 0", jpeg(sof(0xc0, 0, 30))],
    ["JPEG: a frame header too short", jpeg(segment(0xc0, [8, 0, 30]))],
    ["JPEG: a frame with no component", jpeg(segment(0xc0, [8, 0, 30, 0, 40, 0]))],
    ["JPEG: a frame whose length is not its components'", jpeg(segment(0xc0, [8, 0, 30, 0, 40, 2, 1, 0x11, 0]))],
    ["WebP: a second frame after a simple one", (() => {
      const lossy = fixture("webp-lossy.webp");
      const body = [...lossy.slice(8), ...lossy.slice(12)];
      return new Uint8Array([0x52, 0x49, 0x46, 0x46, ...u32le(body.length), ...body]);
    })()],
    ["WebP: bytes after the container", new Uint8Array([...fixture("webp-lossy.webp"), 0, 0])],
    ["JPEG: bytes after the end of image", new Uint8Array([...fixture("jpeg-orientation-6.jpg"), 0xff, 0xd9])],
    ["WebP: a VP8 frame that is not a key frame", (() => { const copy = fixture("webp-lossy.webp").slice(); copy[20] |= 1; return copy; })()],
    ["WebP: a VP8L frame of an unknown version", (() => { const copy = fixture("webp-lossless.webp").slice(); copy[24] |= 0x20; return copy; })()],
    ["JPEG: cut off inside its scan", fixture("jpeg-orientation-6.jpg").slice(0, fixture("jpeg-orientation-6.jpg").length - 2)],
    ["JPEG: a scan with no end of image", new Uint8Array([0xff, 0xd8, ...sof(0xc0, 40, 30), ...SOS, 0x12, 0x34])],
    // FF D9 inside a segment between scans is payload, not the end of the image.
    ["JPEG: cut off after a DHT whose payload holds FF D9", new Uint8Array([0xff, 0xd8, ...sof(0xc2, 40, 30), ...SOS, 0x12, ...segment(0xc4, [0x00, 0xff, 0xd9, 0x00])])],
    ["JPEG: cut off after a COM segment whose payload holds FF D9", new Uint8Array([0xff, 0xd8, ...sof(0xc0, 40, 30), ...SOS, 0x12, ...segment(0xfe, [0xff, 0xd9])])],
    ["JPEG: cut off after an APP segment between scans whose payload holds FF D9", new Uint8Array([0xff, 0xd8, ...sof(0xc2, 40, 30), ...SOS, 0x12, ...segment(0xe2, [0x00, 0xff, 0xd9, 0xff, 0xd9])])],
    ["JPEG: a segment length running past the file", new Uint8Array([0xff, 0xd8, ...sof(0xc0, 40, 30), ...SOS, 0x12, 0xff, 0xfe, 0x00, 0x40, 0xff, 0xd9])],
    ["JPEG: cut off inside a second scan's header", new Uint8Array([0xff, 0xd8, ...sof(0xc2, 40, 30), ...SOS, 0x12, 0xff, 0xda, 0x00, 0x0c, 0xff, 0xd9])],
    ["JPEG: ends before its scan", new Uint8Array([0xff, 0xd8, ...sof(0xc0, 40, 30), 0xff, 0xd9])],
    ["JPEG: a segment length under 2", new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 1, ...sof(0xc0, 40, 30), ...SOS])],
    ["JPEG: garbage between segments", new Uint8Array([0xff, 0xd8, 0x00, ...sof(0xc0, 40, 30), ...SOS])],
    ["PNG: EXIF chunk", pngWith("eXIf", [0x4d, 0x4d, 0, 42])],
    ["PNG: header not first", new Uint8Array([...png.slice(0, 8), ...pngChunk("tEXt", [0x61]), ...png.slice(8)])],
    ["PNG: no end chunk", png.slice(0, png.length - 12)],
    ["PNG: a chunk whose CRC is wrong", (() => { const copy = png.slice(); copy[8 + 8 + 13] ^= 0xff; return copy; })()],
    ["PNG: a header with an impossible colour type and depth", pngHeaderByte(16 + 8, 3)],
    ["PNG: a header with another compression method", pngHeaderByte(16 + 10, 1)],
    ["PNG: a header with an unknown interlace method", pngHeaderByte(16 + 12, 2)],
    ["PNG: no image data", new Uint8Array([...png.slice(0, 33), ...pngChunk("IEND", [])])],
    ["PNG: an empty IDAT", pngWithImageData([[]])],
    ["PNG: IDAT that is not zlib", pngWithImageData([[1, 2, 3, 4, 5]])],
    ["PNG: IDAT inflating to one row too few", pngWithImageData([[...deflateSync(Buffer.alloc(29 * 121))]])],
    ["PNG: IDAT inflating to one byte too many", pngWithImageData([[...deflateSync(Buffer.alloc(30 * 121 + 1))]])],
    ["PNG: a scanline with filter type 5", pngWithImageData([[...deflateSync(Buffer.from(Array.from({ length: 30 * 121 }, (_, i) => (i === 121 ? 5 : 0))))]])],
    ["PNG: image data split by another chunk", (() => {
      const data = [...deflateSync(Buffer.alloc(30 * 121))];
      const half = Math.floor(data.length / 2);
      return new Uint8Array([...png.slice(0, 33), ...pngChunk("IDAT", data.slice(0, half)), ...pngChunk("tEXt", [0x61, 0, 0x62]), ...pngChunk("IDAT", data.slice(half)), ...pngChunk("IEND", [])]);
    })()],
    ["PNG: bytes after the end chunk", new Uint8Array([...png, 0])],
    ["PNG: valid scanlines then trailing bytes in the same IDAT", pngWithImageData([[...deflateSync(Buffer.alloc(30 * 121)), 0, 1, 2]])],
    ["PNG: valid scanlines then trailing bytes in a further IDAT", pngWithImageData([[...deflateSync(Buffer.alloc(30 * 121))], [0xde, 0xad]])],
    ["PNG: a second zlib stream after the first", pngWithImageData([[...deflateSync(Buffer.alloc(30 * 121)), ...deflateSync(Buffer.alloc(1))]])],
    ["PNG: an unknown critical chunk (Apple CgBI)", pngWith("CgBI", [0, 0, 0, 0])],
    ["PNG: an unknown critical chunk after the image data", (() => { const copy = [...png]; copy.splice(png.length - 12, 0, ...pngChunk("ZZZZ", [])); return new Uint8Array(copy); })()],
    ["PNG: a chunk type that is not four letters", pngWith("tE1t", [0x61])],
    ["PNG: a chunk type with the reserved bit set", pngWith("tExt", [0x61])],
    ["PNG: a second header", pngWith("IHDR", [...fixture("png-plain.png").slice(16, 29)])],
    ["PNG: two palettes", (() => { const plte = pngChunk("PLTE", [0, 0, 0]); const copy = [...pngWith("PLTE", [0, 0, 0])]; copy.splice(33, 0, ...plte); return new Uint8Array(copy); })()],
    ["PNG: a palette after the image data", (() => { const copy = [...png]; copy.splice(png.length - 12, 0, ...pngChunk("PLTE", [0, 0, 0])); return new Uint8Array(copy); })()],
    ["PNG: a second end chunk", new Uint8Array([...png, ...pngChunk("IEND", [])])],
    ["PNG: a palette image with no palette", pngHeaderByte(16 + 9, 3)],
    ["PNG: an end chunk with data", new Uint8Array([...png.slice(0, png.length - 12), ...pngChunk("IEND", [0])])],
    ["WebP: EXIF flag", webpVp8x(0x08)],
    ["WebP: animated", webpVp8x(0x02)],
    ["WebP: EXIF chunk", fixture("webp-exif-orientation-6.webp")],
    ["WebP: RIFF size past the file", (() => { const bytes = fixture("webp-lossy.webp"); const copy = bytes.slice(); copy[4] = 0xff; copy[5] = 0xff; return copy; })()],
  ];
  for (const [name, bytes] of cases) {
    it(name, () => assert.equal(refusal(bytes), "IMAGE_FILE_UNDERIVABLE"));
  }
});

function crc32(bytes: readonly number[]): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: readonly number[]): number[] {
  const typed = [...type].map((char) => char.charCodeAt(0));
  return [...u32be(data.length), ...typed, ...data, ...u32be(crc32([...typed, ...data]))];
}

/** The PNG fixture with one header byte changed and the header's CRC made right again. */
function pngHeaderByte(offset: number, value: number): Uint8Array {
  const png = [...fixture("png-plain.png")];
  png[offset] = value;
  const crc = crc32(png.slice(12, 29));
  png.splice(29, 4, ...u32be(crc));
  return new Uint8Array(png);
}

/** The fixture's 40x30 RGB header with the given IDAT chunks and an end. */
function pngWithImageData(chunks: readonly (readonly number[])[]): Uint8Array {
  const png = fixture("png-plain.png");
  return new Uint8Array([...png.slice(0, 33), ...chunks.flatMap((data) => pngChunk("IDAT", data)), ...pngChunk("IEND", [])]);
}

/** The PNG fixture with one chunk inserted after its header. */
function pngWith(type: string, data: readonly number[]): Uint8Array {
  const png = fixture("png-plain.png");
  const afterHeader = 8 + 25;
  return new Uint8Array([...png.slice(0, afterHeader), ...pngChunk(type, data), ...png.slice(afterHeader)]);
}

/** An extended WebP with the given flags and canvas over the lossy fixture's 40x30 frame. */
function webpVp8x(flags: number, canvasWidth = 40, canvasHeight = 30): Uint8Array {
  const lossy = fixture("webp-lossy.webp");
  const frame = [...lossy.slice(12)];
  const u24 = (value: number) => [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff];
  const vp8x = [0x56, 0x50, 0x38, 0x58, ...u32le(10), flags, 0, 0, 0, ...u24(canvasWidth - 1), ...u24(canvasHeight - 1)];
  const body = [0x57, 0x45, 0x42, 0x50, ...vp8x, ...frame];
  return new Uint8Array([0x52, 0x49, 0x46, 0x46, ...u32le(body.length), ...body]);
}

describe("a truncated file never yields another size", () => {
  for (const name of ["jpeg-orientation-6.jpg", "png-plain.png", "webp-lossy.webp", "webp-lossless.webp"]) {
    it(name, () => {
      const bytes = fixture(name);
      const whole = managedImageFileMaterialV1(bytes);
      for (let length = 0; length < bytes.length; length += 1) {
        const prefix = bytes.slice(0, length);
        try {
          const material = managedImageFileMaterialV1(prefix);
          assert.deepEqual([material.mimeType, material.width, material.height], [whole.mimeType, whole.width, whole.height]);
          assert.equal(material.bytes, length, "a prefix states its own length, so its digest and length bind it");
        } catch (error) {
          assert.ok(error instanceof ManagedSiteContractError, `prefix ${length} threw ${String(error)}`);
          assert.equal(error.code, "IMAGE_FILE_UNDERIVABLE");
        }
      }
    });
  }

  it("an extended WebP states its canvas", () => assert.equal(derived(webpVp8x(0x10)), "image/webp 40x30"));
});

describe("PNG image data a decoder can draw", () => {
  it("control: exactly the scanlines, in one or several IDAT chunks, derives", () => {
    const data = [...deflateSync(Buffer.alloc(30 * 121))];
    const half = Math.floor(data.length / 2);
    assert.equal(derived(pngWithImageData([data])), "image/png 40x30");
    assert.equal(derived(pngWithImageData([data.slice(0, half), data.slice(half)])), "image/png 40x30");
  });

  it("control: an Adam7 (interlaced) RGBA PNG sharp wrote derives", () => {
    assert.equal(derived(fixture("png-adam7.png")), "image/png 41x23");
  });

  it("control: unknown ancillary chunks and a suggested palette derive", () => {
    assert.equal(derived(pngWith("tEXt", [0x61, 0, 0x62])), "image/png 40x30");
    assert.equal(derived(pngWith("zzZz", [1, 2, 3])), "image/png 40x30");
    assert.equal(derived(pngWith("PLTE", [0, 0, 0])), "image/png 40x30");
  });
});
