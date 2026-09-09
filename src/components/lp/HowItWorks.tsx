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
