import type { ReactElement } from "react";
import { LpLeadForm } from "@/components/lp/LpLeadForm";
import { Eyebrow, PhoneCtaButton } from "@/components/lp/ui";
import { PHONE_DISPLAY, PHONE_HREF } from "@/components/lp/constants";
import { IconCheck } from "@/components/lp/icons";

const RECAP = [
  "A full review of your current paid social and creative",
  "The biggest conversion gaps between spend and appointments",
  "Prioritized next steps — free, with no obligation",
] as const;

export function FinalCta(): ReactElement {
  return (
    <section id="get-started" className="relative overflow-hidden py-20 md:py-28">
      {/* Dark automotive gradient treatment with contrast for the form. */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(25,200,255,0.14),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(36,125,255,0.16),transparent_45%),linear-gradient(180deg,#0b1220_0%,#080b12_100%)]" />
      <div className="absolute inset-0 -z-10 border-y border-lp-border/60" />

      <div className="mx-auto grid w-[min(1180px,calc(100%-2rem))] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>Free Dealership Marketing Audit</Eyebrow>
          <h2 className="mt-6 max-w-xl font-display font-extrabold uppercase leading-[0.94] tracking-[-0.01em] text-lp-text [font-size:clamp(2.4rem,4.8vw,4rem)]">
            Ready to see what your{" "}
            <span className="bg-gradient-to-r from-lp-cyan to-lp-blue bg-clip-text text-transparent">
              marketing is missing?
            </span>
          </h2>
          <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-lp-muted">
            Request your free dealership audit and consultation. Here&apos;s what
            you&apos;ll get back:
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {RECAP.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-lp-cyan/40 bg-lp-cyan/10 text-lp-cyan">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                <span className="text-[0.98rem] text-lp-text">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PhoneCtaButton className="w-full sm:w-auto" />
            <p className="text-[0.9rem] text-lp-muted">
              Prefer to talk it through? Call{" "}
              <a
                href={PHONE_HREF}
                className="font-semibold text-lp-cyan hover:text-lp-text"
              >
                {PHONE_DISPLAY}
              </a>
            </p>
          </div>
        </div>

        <div className="rounded-[16px] border border-lp-border/80 bg-lp-panel/85 p-6 shadow-[0_30px_80px_-20px_rgba(3,10,24,0.9)] backdrop-blur-md sm:p-8">
          <h3 className="mb-5 font-display text-[1.6rem] font-bold uppercase leading-none tracking-[0.01em] text-lp-text">
            Get my free dealership audit
          </h3>
          <LpLeadForm idSuffixHint="final" />
        </div>
      </div>
    </section>
  );
}
