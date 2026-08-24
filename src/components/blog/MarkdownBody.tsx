import type { ReactElement, ReactNode } from "react";
import BlogImage from "@/components/blog/BlogImage";

interface MarkdownBodyProps {
  source: string;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(!\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null = pattern.exec(text);
  let index = 0;
  while (match) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("![")) {
      const image = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (image) {
        nodes.push(<BlogImage key={index} src={image[2]} alt={image[1]} />);
      }
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={index}>{token.slice(1, -1)}</code>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <a key={index} href={link[2]} className="underline">
            {link[1]}
          </a>,
        );
      }
    }
    last = match.index + token.length;
    index += 1;
    match = pattern.exec(text);
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function headingLevel(line: string): 2 | 3 | null {
  if (line.startsWith("### ")) return 3;
  if (line.startsWith("## ") || line.startsWith("# ")) return 2;
  return null;
}

function renderHeading(line: string, key: number): ReactElement {
  const level = headingLevel(line) ?? 2;
  const text = line.replace(/^#{1,3}\s+/, "");
  const Tag = `h${level}` as "h2" | "h3";
  const className =
    level === 2 ? "mt-10 text-xl font-semibold" : "mt-8 text-lg font-semibold";
  return (
    <Tag key={key} className={className}>
      {renderInline(text)}
    </Tag>
  );
}

function renderList(
  lines: string[],
  ordered: boolean,
  key: number,
): ReactElement {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag key={key} className="mt-4 list-inside space-y-2 pl-1">
      {lines.map((line, index) => (
        <li key={index} className={ordered ? "list-decimal" : "list-disc"}>
          {renderInline(line.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""))}
        </li>
      ))}
    </Tag>
  );
}

function splitBlocks(source: string): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of source.split("\n")) {
    if (line.trim() === "") {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}

function renderBlock(lines: string[], key: number): ReactElement {
  const first = lines[0] ?? "";
  if (headingLevel(first) && lines.length === 1) {
    return renderHeading(first, key);
  }
  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return renderList(lines, false, key);
  }
  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return renderList(lines, true, key);
  }
  return (
    <p
      key={key}
      className="mt-4 leading-relaxed text-neutral-700 first:mt-0 dark:text-neutral-300"
    >
      {renderInline(lines.join(" "))}
    </p>
  );
}

export default function MarkdownBody({
  source,
}: MarkdownBodyProps): ReactElement {
  return (
    <div>
      {splitBlocks(source).map((lines, index) => renderBlock(lines, index))}
    </div>
  );
}
