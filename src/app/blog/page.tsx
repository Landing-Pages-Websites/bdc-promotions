import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import PostCard from "@/components/blog/PostCard";
import { JsonLd } from "@/components/schema/JsonLd";
import { buildBlogIndexSchema } from "@/components/schema/builders";
import { listPublishedPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description: `Articles and updates from ${siteConfig.businessName}.`,
  path: "/blog",
});

export default function BlogIndexPage(): ReactElement {
  const posts = listPublishedPosts();
  const blogIndexSchema = buildBlogIndexSchema(
    posts.map((post) => ({
      title: post.title,
      path: `/blog/${post.slug}`,
    })),
  );

  return (
    <>
      <JsonLd data={blogIndexSchema} />
      <article className="mx-auto w-full max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="mt-2 text-[13px] leading-4 text-[color:var(--muted)] sm:text-sm sm:leading-5">
          Explore practical guides for dealership marketing, lead response, CRM workflows, customer retention, and paid social. Start with the{" "}
          <Link
            className="underline underline-offset-4"
            href="/blog/lead-response-optimization-automotive-dealerships"
          >
            lead response
          </Link>{" "}
          or{" "}
          <Link
            className="underline underline-offset-4"
            href="/blog/dealership-messenger-lead-workflow"
          >
            Messenger workflow
          </Link>{" "}
          guides when you are reviewing follow-up, choose the{" "}
          <Link
            className="underline underline-offset-4"
            href="/blog/automotive-dealership-crm-buyer-guide"
          >
            CRM
          </Link>{" "}
          or{" "}
          <Link
            className="underline underline-offset-4"
            href="/blog/automotive-dealership-customer-retention"
          >
            retention
          </Link>{" "}
          guides when you are reviewing customer handoffs, or use{" "}
          <Link
            className="underline underline-offset-4"
            href="/blog/car-dealership-marketing-agency"
          >
            dealership marketing
          </Link>{" "}
          and{" "}
          <Link
            className="underline underline-offset-4"
            href="/blog/paid-social-advertising-roi-automotive-dealerships"
          >
            paid social
          </Link>{" "}
          resources when you are evaluating broader campaign strategy.
        </p>
        <section aria-label="Articles" className="mt-6 sm:mt-8">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </section>
      </article>
    </>
  );
}
