import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Directory MEGA git-as-CMS publishes into (`github_markdown` contentDir). */
export const BLOG_CONTENT_DIR = "content/blog";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string | null;
  image: string | null;
  imageAlt: string | null;
  author: string | null;
  body: string;
}

interface Frontmatter {
  [key: string]: string | boolean;
}

const POST_EXTENSIONS = new Set([".md", ".mdx"]);

function blogRoot(): string {
  return join(process.cwd(), BLOG_CONTENT_DIR);
}

function pickString(data: Frontmatter, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseScalar(raw: string): string | boolean {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseFrontmatter(raw: string): {
  data: Frontmatter;
  body: string;
} {
  if (!raw.startsWith("---")) {
    return { data: {}, body: raw.trim() };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, body: raw.trim() };
  }
  const block = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\s+/, "");
  const data: Frontmatter = {};
  for (const line of block.split("\n")) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    data[key] = parseScalar(line.slice(separator + 1));
  }
  return { data, body: body.trim() };
}

function isDraft(data: Frontmatter): boolean {
  return data.draft === true || data.draft === "true";
}

function toPost(filename: string, raw: string): BlogPost | null {
  const { data, body } = parseFrontmatter(raw);
  if (isDraft(data)) return null;
  const slug =
    pickString(data, ["slug"]) ?? filename.replace(/\.(md|mdx)$/i, "");
  const title = pickString(data, ["title"]);
  if (!slug || !title) return null;
  return {
    slug,
    title,
    description:
      pickString(data, ["description", "excerpt", "summary"]) ?? "",
    date: pickString(data, ["date", "publishedAt", "publishDate"]),
    image: pickString(data, ["image", "heroImage", "featuredImage"]),
    imageAlt: pickString(data, [
      "imageAlt",
      "heroImageAlt",
      "featuredImageAlt",
    ]),
    author: pickString(data, ["author"]),
    body,
  };
}

function readPostFiles(): BlogPost[] {
  let names: string[];
  try {
    names = readdirSync(blogRoot());
  } catch {
    return [];
  }
  return names
    .filter((name) => POST_EXTENSIONS.has(name.slice(name.lastIndexOf("."))))
    .map((name) => {
      const raw = readFileSync(join(blogRoot(), name), "utf8");
      return toPost(name, raw);
    })
    .filter((post): post is BlogPost => post !== null);
}

export function listPublishedPosts(): BlogPost[] {
  return readPostFiles().sort((left, right) => {
    if (left.date && right.date) return right.date.localeCompare(left.date);
    if (left.date) return -1;
    if (right.date) return 1;
    return left.title.localeCompare(right.title);
  });
}

export function getPublishedPost(slug: string): BlogPost | null {
  return listPublishedPosts().find((post) => post.slug === slug) ?? null;
}
