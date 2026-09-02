import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_TOTAL_BYTES,
  parseSignedUploads,
  selectUploadableFiles,
} from "./leadUploads.ts";

function file(name: string, type: string, size: number): File {
  // Constructed rather than built from real bytes so a 10MB case does not
  // allocate 10MB; only `size` is read.
  const handle = new File([""], name, { type });
  Object.defineProperty(handle, "size", { value: size });
  return handle;
}

const pdf = () => file("quote.pdf", "application/pdf", 1024);

test("selectUploadableFiles accepts an ordinary document", () => {
  const { accepted, rejected } = selectUploadableFiles([pdf()]);
  assert.equal(accepted.length, 1);
  assert.equal(rejected.length, 0);
});

test("selectUploadableFiles reports files past the cap instead of dropping them", () => {
  // Refusing beats truncating: a visitor who attaches a file, sees no error and
  // assumes it was sent is worse off than one who is told it was not.
  const files = Array.from({ length: MAX_UPLOAD_FILES + 2 }, () => pdf());
  const { accepted, rejected } = selectUploadableFiles(files);
  assert.equal(accepted.length, MAX_UPLOAD_FILES);
  assert.equal(rejected.length, 2);
  for (const rejection of rejected) {
    assert.match(rejection.reason, /files can be attached/);
  }
});

test("selectUploadableFiles refuses every type outside the allowlist", () => {
  const refused = [
    "image/svg+xml",
    "application/zip",
    "application/x-msdownload",
    "text/html",
    "application/octet-stream",
    "",
  ];
  for (const type of refused) {
    const { accepted, rejected } = selectUploadableFiles([
      file("f", type, 1024),
    ]);
    assert.equal(accepted.length, 0, `accepted ${type}`);
    assert.match(rejected[0].reason, /file type/);
  }
});

test("selectUploadableFiles refuses a file over the per-file ceiling", () => {
  const { accepted, rejected } = selectUploadableFiles([
    file("big.pdf", "application/pdf", MAX_UPLOAD_BYTES + 1),
  ]);
  assert.equal(accepted.length, 0);
  assert.match(rejected[0].reason, /under \d+MB/);
});

test("selectUploadableFiles refuses an empty file", () => {
  const { accepted } = selectUploadableFiles([
    file("empty.pdf", "application/pdf", 0),
  ]);
  assert.equal(accepted.length, 0);
});

test("selectUploadableFiles enforces the total even when each file fits", () => {
  // Three 9MB files each pass the per-file ceiling; together they do not.
  const nine = 9 * 1024 * 1024;
  const { accepted, rejected } = selectUploadableFiles([
    file("a.pdf", "application/pdf", nine),
    file("b.pdf", "application/pdf", nine),
    file("c.pdf", "application/pdf", nine),
  ]);
  const total = accepted.reduce((sum, f) => sum + f.size, 0);
  assert.ok(total <= MAX_UPLOAD_TOTAL_BYTES);
  assert.equal(accepted.length, 2);
  assert.match(rejected[0].reason, /total/);
});

test("selectUploadableFiles keeps a small file that fits after a large refusal", () => {
  // Skipping leaves the running total untouched, so later room stays usable.
  const { accepted } = selectUploadableFiles([
    file("huge.pdf", "application/pdf", MAX_UPLOAD_BYTES + 1),
    pdf(),
  ]);
  assert.deepEqual(
    accepted.map((f) => f.name),
    ["quote.pdf"],
  );
});

test("selectUploadableFiles accepts nothing from an empty selection", () => {
  assert.deepEqual(selectUploadableFiles([]), { accepted: [], rejected: [] });
});

const validUpload = {
  s3Key: "lead-uploads/pending/c/u/quote.pdf",
  uploadUrl: "https://signed.example/put",
  contentType: "application/pdf",
  sizeBytes: 1024,
};

test("parseSignedUploads accepts a well-formed response", () => {
  assert.deepEqual(parseSignedUploads({ uploads: [validUpload] }), [
    validUpload,
  ]);
});

test("parseSignedUploads returns null for anything malformed", () => {
  // A malformed response must not be partially used: uploading whatever
  // survived would leave the visitor believing every file was sent.
  const malformed: unknown[] = [
    null,
    {},
    { uploads: null },
    { uploads: {} },
    { uploads: [{ ...validUpload, s3Key: "" }] },
    { uploads: [{ ...validUpload, sizeBytes: "1024" }] },
    { uploads: [validUpload, { ...validUpload, uploadUrl: undefined }] },
  ];
  for (const value of malformed) {
    assert.equal(parseSignedUploads(value), null, JSON.stringify(value));
  }
});

test("parseSignedUploads refuses a URL that is not https", () => {
  // The URL is followed with the visitor's file in the request body.
  for (const uploadUrl of [
    "http://insecure.example/put",
    "ftp://elsewhere/put",
    "javascript:alert(1)",
  ]) {
    assert.equal(
      parseSignedUploads({ uploads: [{ ...validUpload, uploadUrl }] }),
      null,
      uploadUrl,
    );
  }
});
