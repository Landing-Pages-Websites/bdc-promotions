import type { ReactElement } from "react";
import { DualCta, SECTION_SHELL, SectionHeading } from "@/components/lp/ui";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/lp/constants";
import { IconChevronDown } from "@/components/lp/icons";

const FAQS = [
  {
    q: "Who is the free dealership audit for?",
    a: "Franchise dealerships and established independent dealers running — or planning to run — paid social. If you sell cars and want more real showroom appointments, the audit is built for you.",
  },
  {
    q: "Do I need a certain inventory size to qualify?",
    a: "The audit is open to any dealership. We ask your inventory size (fewer than 50, or 50 or more) so we can tailor the recommendations to your store — it doesn't affect whether you can request the audit.",
  },
  {
    q: "Which states do you work with?",
    a: "We partner with dealerships across multiple U.S. states. Share your details on the form or give us a call and we'll confirm fit for your market.",
  },
  {
    q: "What's included in the free audit?",
    a: "A review of your current paid social and creative, the biggest conversion gaps we find, and a prioritized set of next steps. There's no cost and no obligation to work with us afterward.",
  },
  {
    q: "How do I get started?",
    a: `Complete the short form or call ${PHONE_DISPLAY}. Either way you reach the BDC Promotions team directly — no call center in between.`,
  },
] as const;

export function LpFaq(): ReactElement {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className={`${SECTION_SHELL} grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-12`}>
        <div className="lg:col-span-4">
          <SectionHeading
            eyebrow="Questions & Answers"
            title="Before you request your audit"
            intro="The details dealership operators ask us most often. Still unsure? Call and we'll answer directly."
          />
          <a
            href={PHONE_HREF}
            className="mt-6 inline-flex font-display text-[1.1rem] font-bold uppercase tracking-[0.04em] text-lp-cyan transition-colors hover:text-lp-text"
          >
            {PHONE_DISPLAY}
          </a>
        </div>

        <div className="lg:col-span-8">
          <ul className="flex flex-col gap-3">
            {FAQS.map(({ q, a }) => (
              <li key={q}>
                <details className="group rounded-[12px] border border-lp-border/70 bg-lp-panel/55 transition-colors duration-200 open:border-lp-cyan/45 hover:border-lp-cyan/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-[1.12rem] font-bold uppercase tracking-[0.005em] text-lp-text [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-cyan">
                    {q}
                    <IconChevronDown className="h-5 w-5 shrink-0 text-lp-cyan transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-[0.98rem] leading-relaxed text-lp-muted">
                    {a}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`${SECTION_SHELL} mt-14`}>
        <DualCta />
      </div>
    </section>
  );
}
