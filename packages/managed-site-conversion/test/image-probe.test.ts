import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { deflateSync } from "node:zlib";

import { aspectRatioOf, probeImage } from "../src/image-probe.js";

function crc32(buffer: Buffer): number {
  let value = ~0;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (~value) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function png(width: number, height: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const pixels = deflateSync(Buffer.alloc(height * (1 + width * 3)));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", pixels),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function jpeg(width: number, height: number): Buffer {
  const segment = Buffer.alloc(11);
  segment.writeUInt16BE(0xffc0, 0);
  segment.writeUInt16BE(9, 2);
  segment[4] = 8;
  segment.writeUInt16BE(height, 5);
  segment.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), segment, Buffer.from([0xff, 0xd9])]);
}

function webpLossy(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(40);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(32, 4);
  buffer.write("WEBP", 8, "ascii");
  buffer.write("VP8 ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(width, 26);
  buffer.writeUInt16LE(height, 28);
  return buffer;
}

function write(name: string, bytes: Buffer): string {
  const path = join(mkdtempSync(join(tmpdir(), "managed-site-image-")), name);
  writeFileSync(path, bytes);
  return path;
}

const CASES: readonly (readonly [string, Buffer, string, number, number])[] = [
  ["a.png", png(120, 60), "image/png", 120, 60],
  ["b.jpg", jpeg(800, 400), "image/jpeg", 800, 400],
  ["c.webp", webpLossy(2048, 1024), "image/webp", 2048, 1024],
];

test("dimensions and digests are read from the committed file", () => {
  for (const [name, bytes, mimeType, width, height] of CASES) {
    const probed = probeImage(write(name, bytes));
    assert.ok(probed !== null, `failed to probe ${name}`);
    assert.equal(probed.mimeType, mimeType);
    assert.equal(probed.width, width);
    assert.equal(probed.height, height);
    assert.equal(probed.bytes, bytes.byteLength);
    assert.match(probed.sha256, /^[a-f0-9]{64}$/u);
  }
});

test("an unreadable file is reported as unknown, never assumed", () => {
  assert.equal(probeImage(write("d.gif", Buffer.from("GIF89a not really"))), null);
  assert.equal(probeImage(join(tmpdir(), "managed-site-does-not-exist.png")), null);
});

test("aspect ratios are reduced, not rounded", () => {
  const probed = probeImage(write("e.png", png(1920, 1080)));
  assert.ok(probed !== null);
  assert.deepEqual(aspectRatioOf(probed), { width: 16, height: 9 });
});
