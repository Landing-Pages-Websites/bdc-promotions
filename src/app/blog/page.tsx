import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { JsonLd } from "@/components/schema/JsonLd";
import { buildBlogIndexSchema } from "@/components/schema/builders";
import { InteriorChapter, InteriorLinks, InteriorPage } from "@/components/signal-lane/InteriorPage";
import shared from "@/components/signal-lane/interior-page.module.css";
import { formatPublishedDate, listPublishedPosts, publishedDate } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import styles from "./blog-index.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Automotive Marketing & BDC Insights",
  description: "Explore BDC Promotions’ guides to dealership marketing, lead response, CRM workflows, customer retention and paid social. Find a useful starting point for your team.",
  path: "/blog",
});

const startingPoints = [
  { slug: "automotive-dealership-crm-buyer-guide", context: "Review the records, routing and appointment handoffs your CRM needs to support." },
  { slug: "car-dealership-marketing-agency", context: "Compare agency responsibilities, creative, lead handling and reporting before choosing a partner." },
  { slug: "welcome", context: "Start with the connection between timely lead response and a useful shopper conversation." },
] as const;

export default function BlogIndexPage(): ReactElement {
  const posts = listPublishedPosts();
  const blogIndexSchema = buildBlogIndexSchema(
    posts.map((post) => ({ title: post.title, path: `/blog/${post.slug}` })),
  );

  return <div className={styles.surface}><InteriorPage path="/blog" title="Automotive marketing & BDC insights"
    intro="Practical reading for dealership owners, sales, marketing and BDC teams. Explore the decisions behind campaigns, shopper conversations and appointment handoffs."
    chapters={[{ href: "#find-your-topic", label: "Find your topic" }, { href: "#start-reading", label: "Start with a guide" }, { href: "#all-articles", label: "Browse all articles" }]}
    contactTitle="Put the questions to work at your store"
    contactCopy="Bring the campaign or follow-up questions raised by your reading. Discuss where BDC Promotions can support your dealership."
    contactLabel="Discuss your dealership">
    <JsonLd data={blogIndexSchema} />
    <InteriorChapter id="find-your-topic" title="What are you working through?">
      <div className={styles.topics}>
        <div><h3>Shopper response</h3><p>Review how a new inquiry becomes a conversation and moves between team members.</p><div className={styles.topicLinks}><Link className={shared.textLink} href="/blog/lead-response-optimization-automotive-dealerships">Lead response →</Link><Link className={shared.textLink} href="/blog/dealership-messenger-lead-workflow">Messenger workflow →</Link></div></div>
        <div><h3>Customer continuity</h3><p>Consider the records and follow-up that connect first contact with an ongoing customer relationship.</p><div className={styles.topicLinks}><Link className={shared.textLink} href="/blog/automotive-dealership-crm-buyer-guide">CRM buyer guide →</Link><Link className={shared.textLink} href="/blog/automotive-dealership-customer-retention">Customer retention →</Link></div></div>
        <div><h3>Campaign decisions</h3><p>Evaluate marketing responsibilities and how paid social activity connects to dealership opportunities.</p><div className={styles.topicLinks}><Link className={shared.textLink} href="/blog/car-dealership-marketing-agency">Agency selection →</Link><Link className={shared.textLink} href="/blog/paid-social-advertising-roi-automotive-dealerships">Paid social measurement →</Link></div></div>
      </div>
    </InteriorChapter>
    <InteriorChapter id="start-reading" title="Three useful starting points" dark>
      <div className={styles.startingPoints}>
        {startingPoints.map(({ slug, context }) => {
          const post = posts.find((entry) => entry.slug === slug);
          return post ? <div key={slug}><h3><Link href={`/blog/${post.slug}`}>{post.title} <span aria-hidden="true">↗</span></Link></h3><p>{context}</p></div> : null;
        })}
      </div>
    </InteriorChapter>
    <InteriorChapter id="all-articles" title="All articles">
      <p className={shared.chapterIntro}>Browse the published guides from BDC Promotions, with their original publication dates.</p>
      <div className={styles.archive}>
        {posts.map(post => {
          const dateLabel = formatPublishedDate(post);
          const date = publishedDate(post);
          return <article key={post.slug} className={styles.post} aria-labelledby={`post-${post.slug}`}>
            <div className={styles.date}>{dateLabel && (date ? <time dateTime={date.toISOString()}>{dateLabel}</time> : <span>{dateLabel}</span>)}</div>
            <h3 id={`post-${post.slug}`}><Link href={`/blog/${post.slug}`}>{post.title} <span aria-hidden="true">↗</span></Link></h3>
            <p>{post.description}</p>
          </article>;
        })}
      </div>
    </InteriorChapter>
    <InteriorLinks title="Explore related support" links={[{ href: "/services/lead-generation", label: "Lead generation" }, { href: "/services/lead-nurturing-appointment-setting", label: "Lead nurturing & appointment setting" }, { href: "/process", label: "How the work connects" }]} />
  </InteriorPage></div>;
}
