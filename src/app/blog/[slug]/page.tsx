import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import MarkdownBody from "@/components/blog/MarkdownBody";
import { JsonLd } from "@/components/schema/JsonLd";
import { buildArticleSchema } from "@/components/schema/builders";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

interface ArticleParams {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): Array<{ slug: string }> {
  return listPublishedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: ArticleParams): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublishedPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.title,
    description: post.description || post.title,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogArticlePage({
  params,
}: ArticleParams): Promise<ReactElement> {
  const { slug } = await params;
  const post = getPublishedPost(slug);
  if (!post) notFound();
  const path = `/blog/${post.slug}`;
  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-16">
      {post.date ? (
        <JsonLd
          data={buildArticleSchema({
            headline: post.title,
            description: post.description || post.title,
            path,
            datePublished: post.date,
            imagePath: post.image ?? undefined,
          })}
        />
      ) : null}
      <p className="text-sm text-neutral-500">
        <Link href="/blog" className="underline">
          ← All articles
        </Link>
        {post.date ? (
          <>
            {" · "}
            <time dateTime={post.date}>{post.date}</time>
          </>
        ) : null}
      </p>
      <h1 className="mt-6 text-3xl font-bold">{post.title}</h1>
      {post.author ? (
        <p className="mt-2 text-sm text-neutral-500">By {post.author}</p>
      ) : null}
      <div className="mt-10">
        <MarkdownBody source={post.body} />
      </div>
    </article>
  );
}
