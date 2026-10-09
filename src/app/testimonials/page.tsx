import type { Metadata } from "next";
import { InteriorChapter, InteriorLinks, InteriorPage } from "@/components/signal-lane/InteriorPage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";
import styles from "./testimonials.module.css";

const description = "Watch Curt share his experience with BDC Promotions in this two-part customer testimonial.";
const labels = ["Curt’s Testimonial — Part 1", "Curt’s Testimonial — Part 2"] as const;

export const metadata: Metadata = buildMetadata({ title: "Dealership Testimonials", description, path: "/testimonials" });

export default function TestimonialsPage() {
  return <InteriorPage path="/testimonials" title="Hear from Curt" intro={description}
    chapters={[{ href: "#curt-part-1", label: "Watch Part 1" }, { href: "#curt-part-2", label: "Watch Part 2" }]}
    contactTitle="Talk about your own dealership’s needs"
    contactCopy="Discuss your advertising, shopper response and appointment process with BDC Promotions."
    contactLabel="Contact BDC Promotions">
    {labels.map((label, index) => {
      const media = siteConfig.testimonialVideos[index];
      return <InteriorChapter key={label} id={`curt-part-${index + 1}`} title={label}>
        <div className={styles.interview}>
          <p>{index === 0 ? "Begin Curt’s interview here, then continue with Part 2 below." : "Continue the same interview. The poster for this part shows BDC Promotions representative Justin Specht."}</p>
          <video controls playsInline preload="metadata" width={640} height={360} aria-label={label} src={media.src} poster={media.poster}>
            <a href={media.src}>Download {label}</a>
          </video>
          <a className={styles.download} href={media.src} download>Download {label} (MP4)</a>
        </div>
      </InteriorChapter>;
    })}
    <InteriorLinks title="Explore the work behind the conversation" links={[{ href: "/process", label: "How the process works" }, { href: "/work", label: "Automotive advertising examples" }, { href: "/services/lead-nurturing-appointment-setting", label: "Lead nurturing & appointment setting" }]} />
  </InteriorPage>;
}
