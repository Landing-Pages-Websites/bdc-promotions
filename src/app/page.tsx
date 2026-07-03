import type { Metadata } from "next";
import type { ReactElement } from "react";
import { LeadForm } from "@/components/LeadForm";
import { JsonLd } from "@/components/schema/JsonLd";
import { buildBusinessSchema, buildFaqSchema } from "@/components/schema/builders";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = buildMetadata({ path: "/" });

const demoFaqs = [
  {
    question: "PLACEHOLDER — What services do you offer?",
    answer: "PLACEHOLDER — Replace this FAQ with real customer content.",
  },
  {
    question: "PLACEHOLDER — What areas do you serve?",
    answer: `PLACEHOLDER — This site serves: ${siteConfig.serviceAreas.join(", ")}.`,
  },
];

/**
 * DEMO home page — obviously-placeholder content that exercises the
 * plumbing (buildMetadata, schema builders, LeadForm). Site builders
 * replace everything visual here; keep the JsonLd business schema.
 */
export default function HomePage(): ReactElement {
  return (
    <>
      <JsonLd data={buildBusinessSchema()} />
      <JsonLd data={buildFaqSchema(demoFaqs)} />

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center">
        <p className="rounded-full border border-dashed border-amber-500 px-4 py-1 text-xs font-medium uppercase tracking-wide text-amber-600">
          Placeholder page — replace with real content
        </p>
        <h1 className="text-4xl font-bold">{siteConfig.businessName}</h1>
        <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          {siteConfig.description}
        </p>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 pb-16">
        <h2 className="text-2xl font-semibold">
          PLACEHOLDER — Frequently asked questions
        </h2>
        <dl className="mt-6 space-y-6">
          {demoFaqs.map((faq) => (
            <div key={faq.question}>
              <dt className="font-medium">{faq.question}</dt>
              <dd className="mt-1 text-neutral-600 dark:text-neutral-400">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pb-24">
        <h2 className="text-2xl font-semibold">Get in touch</h2>
        <LeadForm />
      </section>
    </>
  );
}
