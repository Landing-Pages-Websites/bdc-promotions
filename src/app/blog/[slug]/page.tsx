import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import SelectedArticlePage from "@/components/signal-lane/SelectedArticlePage";
import { JsonLd } from "@/components/schema/JsonLd";
import {
  buildArticleSchema,
  buildFaqSchema,
} from "@/components/schema/builders";
import {
  getPublishedPost,
  listPublishedPosts,
  publishedDate,
} from "@/lib/blog";
import { blogFaqBySlug } from "@/lib/blog-faq";
import { buildMetadata } from "@/lib/seo";

interface ArticleParams {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): Array<{ slug: string }> {
  return listPublishedPosts().map((post) => ({ slug: post.slug }));
}

/**
 * Only the params `generateStaticParams` returned are valid routes.
 *
 * Without this, `dynamicParams` defaults to true: Next renders ANY slug on
 * demand, the page calls `notFound()` mid-stream, and the 404 comes back with
 * an EMPTY <body> because the shell had already flushed. A crawler or a stale
 * inbound link gets a blank page with no header and no way back into the site.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: ArticleParams): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublishedPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.description || post.title,
    socialTitle: post.title,
    socialDescription: post.description || post.title,
    path: `/blog/${post.slug}`,
    ogImagePath: post.image ?? undefined,
  });
}

export default async function BlogArticlePage({
  params,
}: ArticleParams): Promise<ReactElement> {
  const { slug } = await params;
  const post = getPublishedPost(slug);
  if (!post) notFound();
  const path = `/blog/${post.slug}`;
  // The Article schema and the <time> element are both machine-readable, so
  // both need a date that actually parses rather than whatever text the
  // frontmatter carried: Google rejects a rich result with a bad
  // datePublished, and an invalid dateTime attribute is worse than no <time>.
  // The date the author wrote is still shown either way.
  const publishedIso = publishedDate(post)?.toISOString() ?? null;
  const faqItems = blogFaqBySlug[post.slug];
  return (
    <SelectedArticlePage post={post} publishedIso={publishedIso}>
      {publishedIso ? (
        <JsonLd
          data={buildArticleSchema({
            headline: post.title,
            description: post.description || post.title,
            path,
            datePublished: publishedIso,
            imagePath: post.image ?? undefined,
          })}
        />
      ) : null}
      {faqItems ? <JsonLd data={buildFaqSchema(faqItems)} /> : null}
    </SelectedArticlePage>
  );
}
