import assert from "node:assert/strict";
import test from "node:test";
import {
  MEGA_ARTICLE_IMAGE_HOST,
  canOptimizeBlogImage,
} from "./blog-images.ts";

test("canOptimizeBlogImage allows local paths and MEGA article S3 URLs", () => {
  assert.equal(canOptimizeBlogImage("/blog/cover.webp"), true);
  assert.equal(
    canOptimizeBlogImage(
      `https://${MEGA_ARTICLE_IMAGE_HOST}/article_images/acme/cover.webp`,
    ),
    true,
  );
  assert.equal(
    canOptimizeBlogImage(
      "https://s3.us-east-2.amazonaws.com/zleague-public-prod/article_images/acme/cover.webp",
    ),
    true,
  );
});

test("canOptimizeBlogImage rejects other remotes so they render unoptimized", () => {
  assert.equal(canOptimizeBlogImage("https://cdn.example.com/x.webp"), false);
  assert.equal(
    canOptimizeBlogImage(
      "https://s3.us-east-2.amazonaws.com/someone-else/cover.webp",
    ),
    false,
  );
  assert.equal(canOptimizeBlogImage("not a url"), false);
  assert.equal(canOptimizeBlogImage("//cdn.example.com/x.webp"), false);
  assert.equal(
    canOptimizeBlogImage(
      `//${MEGA_ARTICLE_IMAGE_HOST}/article_images/acme/cover.webp`,
    ),
    false,
  );
});
