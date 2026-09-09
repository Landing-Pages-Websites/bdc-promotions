import Image from "next/image";
import type { ReactElement } from "react";
import { DualCta, SECTION_SHELL, SectionHeading } from "@/components/lp/ui";

const STEPS = [
  {
    n: "01",
    title: "Review your current marketing",
    copy: "We audit your paid social, creative, and follow-up exactly as they run today — no guesswork, no assumptions.",
  },
  {
    n: "02",
    title: "Identify the biggest conversion gaps",
    copy: "We pinpoint where attention is leaking before it ever becomes a conversation or a booked appointment.",
  },
  {
    n: "03",
    title: "Deliver focused next-step recommendations",
    copy: "You get a clear, prioritized plan you can act on — free, with no obligation to work with us.",
  },
] as const;

export function HowItWorks(): ReactElement {
  return (
    <section id="how-it-works" className="border-y border-lp-border/60 bg-lp-panel/30 py-20 md:py-28">
      <div className={SECTION_SHELL}>
        <SectionHeading
          eyebrow="How The Free Audit Works"
          title={
            <>
              Three steps. Zero cost.{" "}
              <span className="text-lp-cyan">No obligation.</span>
            </>
          }
          intro="The audit is genuinely free. Here's exactly what happens once you request one."
        />

        {/* Cinematic lead-in: an approved sample of an audit consultation,
            wide-cropped so it reads as a banner rather than a card. */}
        <figure className="relative mt-12 overflow-hidden rounded-[18px] border border-lp-border/70 shadow-[0_30px_80px_-30px_rgba(3,10,24,0.9)]">
          <Image
            src="/lp/bdc-audit-consultation.webp"
            alt="A BDC Promotions consultant walking a dealer through a free marketing audit on screen"
            width={1248}
            height={832}
            sizes="(min-width: 1024px) 1100px, 100vw"
            className="h-full max-h-[420px] w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lp-ink via-lp-ink/25 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <span className="font-display text-[0.72rem] font-bold uppercase tracking-[0.16em] text-lp-cyan">
              Inside a free audit consultation
            </span>
            <p className="mt-1.5 max-w-md text-[0.9rem] leading-relaxed text-lp-text/90">
              We walk your team through what we find — screen to screen, no
              pressure, no obligation.
            </p>
          </figcaption>
        </figure>

        {/* Numbered process rail — the numbering encodes a real sequence. */}
        <ol className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map(({ n, title, copy }, i) => (
            <li
              key={n}
              className="relative flex flex-col rounded-[14px] border border-lp-border/70 bg-lp-panel/60 p-6"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-[2.6rem] font-extrabold leading-none text-lp-cyan">
                  {n}
                </span>
                {i < STEPS.length - 1 ? (
                  <span className="hidden h-px flex-1 bg-gradient-to-r from-lp-cyan/50 to-transparent md:block" />
                ) : null}
              </div>
              <h3 className="mt-4 font-display text-[1.3rem] font-bold uppercase leading-tight tracking-[0.005em] text-lp-text">
                {title}
              </h3>
              <p className="mt-2.5 text-[0.96rem] leading-relaxed text-lp-muted">
                {copy}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-14">
          <DualCta label="Start My Free Audit" />
        </div>
      </div>
    </section>
  );
}
