import Link from "next/link";
import type { ReactNode } from "react";
import BlogImage from "@/components/blog/BlogImage";
import MarkdownBody from "@/components/blog/MarkdownBody";
import { formatPublishedDate, getPublishedPost, type BlogPost } from "@/lib/blog";
import { InteriorLinks, InteriorPage } from "./InteriorPage";
import SelectedArticleBody from "./SelectedArticleBody";
import styles from "./selected-article.module.css";
import { selectedArticleImageSrc } from "./selected-article-images";

const readingSlugs = [
  "welcome",
  "car-dealership-marketing-agency",
  "automotive-dealership-crm-buyer-guide",
] as const;

export default function SelectedArticlePage({ post, publishedIso, children }: {
  post: BlogPost;
  publishedIso: string | null;
  children: ReactNode;
}) {
  const relatedPosts = readingSlugs
    .filter((slug) => slug !== post.slug)
    .map(getPublishedPost)
    .filter((entry): entry is BlogPost => entry !== null);

  return (
    <div className={styles.surface}>
      <InteriorPage
        path={`/blog/${post.slug}`}
        title={post.title}
        intro={post.description}
        chapters={[
          { href: "#article-content", label: "Read the article" },
          { href: "#related-articles", label: "Keep reading" },
          { href: "#discuss-your-dealership", label: "Discuss your dealership" },
        ]}
        contactTitle="Bring your questions to the conversation"
        contactCopy="Discuss how campaigns, shopper conversations and appointment handoffs fit your dealership’s workflow."
        contactLabel="Discuss your dealership"
      >
        {children}
        <article className={styles.article} id="article-content" aria-labelledby="interior-title">
          <div className={styles.reading}>
            <div className={styles.metadata}>
              <Link href="/blog">← Back to Insights</Link>
              <div>
                {post.author ? <span>By {post.author}</span> : null}
                {post.date ? (
                  publishedIso ? <time dateTime={publishedIso}>{formatPublishedDate(post)}</time> : <span>{post.date}</span>
                ) : null}
              </div>
            </div>
            {post.image ? (
              <div className={styles.image}>
                <BlogImage src={selectedArticleImageSrc(post.slug, post.image)} alt={post.imageAlt ?? post.title} variant="banner" priority />
              </div>
            ) : null}
            <div className={styles.body} data-article-body>
              {post.slug === "car-dealership-marketing-agency"
                ? <SelectedArticleBody source={post.body} />
                : <MarkdownBody source={post.body} />}
            </div>
          </div>
        </article>
        <section className={styles.related} id="related-articles" aria-labelledby="keep-reading-title">
          <div className={styles.relatedInner}>
            <h2 id="keep-reading-title">Keep reading</h2>
            <div className={styles.readNext}>
              {relatedPosts.map((entry) => (
                <div key={entry.slug}>
                  <h3><Link href={`/blog/${entry.slug}`}>{entry.title}<span aria-hidden="true"> →</span></Link></h3>
                  <p>{entry.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <InteriorLinks title="Explore related support" links={[
          { href: "/services/lead-generation", label: "Lead generation" },
          { href: "/services/lead-nurturing-appointment-setting", label: "Lead nurturing & appointment setting" },
          { href: "/process", label: "How the work connects" },
        ]} />
      </InteriorPage>
    </div>
  );
}
