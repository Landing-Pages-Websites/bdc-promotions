import Image from "next/image";
import type { ReactElement } from "react";
import { LpLeadForm } from "@/components/lp/LpLeadForm";
import { Eyebrow, PhoneCtaButton } from "@/components/lp/ui";
import { IconCheck } from "@/components/lp/icons";

const PILLARS = ["Fast", "Focused", "Social", "Results"] as const;

const HERO_PROOF = [
  "15 years focused only on automotive marketing",
  "Built for booked appointments, not vanity impressions",
] as const;

export function LpHero(): ReactElement {
  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Full-bleed real blue-hour showroom photo + single graduated scrim. */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/lp/bdc-night-showroom.webp"
          alt="BDC Promotions dealership showroom illuminated at blue hour"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-lp-ink via-lp-ink/90 to-lp-ink/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-lp-ink via-lp-ink/50 to-transparent" />
      </div>

      <div className="mx-auto grid w-[min(1180px,calc(100%-2rem))] grid-cols-1 items-center gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <Eyebrow>Free Dealership Marketing Audit</Eyebrow>
          <h1 className="mt-6 max-w-2xl font-display font-extrabold uppercase leading-[0.92] tracking-[-0.01em] text-lp-text [font-size:clamp(2.9rem,6vw,5.4rem)]">
            Turn paid social into more{" "}
            <span className="bg-gradient-to-r from-lp-cyan to-lp-blue bg-clip-text text-transparent">
              qualified showroom appointments
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-lp-muted">
            BDC Promotions has spent 15 years turning paid social attention into
            real dealership results — booked appointments and showroom
            opportunities, not impressions that never reach the sales floor.
            Start with a free marketing audit and consultation.
          </p>

          <ul className="mt-7 flex flex-col gap-2.5">
            {HERO_PROOF.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-lp-cyan/40 bg-lp-cyan/10 text-lp-cyan">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                <span className="text-[0.98rem] text-lp-text">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            {PILLARS.map((pillar, i) => (
              <span key={pillar} className="flex items-center gap-3">
                {i > 0 ? (
                  <span className="h-1 w-1 rounded-full bg-lp-cyan/60" />
                ) : null}
                <span className="font-display text-[0.95rem] font-bold uppercase tracking-[0.14em] text-lp-muted">
                  {pillar}
                </span>
              </span>
            ))}
          </div>

          <div className="mt-8">
            <PhoneCtaButton className="w-full sm:w-auto" />
          </div>
        </div>

        {/* Lead form lives in the hero (split layout). */}
        <div className="lg:col-span-5">
          <div className="rounded-[16px] border border-lp-border/80 bg-lp-panel/85 p-6 shadow-[0_30px_80px_-20px_rgba(3,10,24,0.9)] backdrop-blur-md sm:p-7">
            <div className="mb-5">
              <h2 className="font-display text-[1.7rem] font-bold uppercase leading-none tracking-[0.01em] text-lp-text">
                Get your free dealership audit
              </h2>
              <p className="mt-2.5 text-[0.92rem] leading-relaxed text-lp-muted">
                Tell us where to send it. We&apos;ll review your current
                marketing and show you the gaps — no cost, no obligation.
              </p>
            </div>
            <LpLeadForm idSuffixHint="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
