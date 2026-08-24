import Link from "next/link";
import type { ReactElement } from "react";
import type { BlogPost } from "@/lib/blog";

interface PostCardProps {
  post: BlogPost;
}

export default function PostCard({ post }: PostCardProps): ReactElement {
  return (
    <article className="border-b border-neutral-200 py-8 last:border-b-0">
      {post.date ? (
        <time dateTime={post.date} className="text-sm text-neutral-500">
          {post.date}
        </time>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold">
        <Link href={`/blog/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      {post.description ? (
        <p className="mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300">
          {post.description}
        </p>
      ) : null}
      <Link
        href={`/blog/${post.slug}`}
        className="mt-3 inline-block text-sm font-medium underline"
      >
        Read article
      </Link>
    </article>
  );
}
