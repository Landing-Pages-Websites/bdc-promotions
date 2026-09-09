import Image from "next/image";
import type { ReactElement, SVGProps } from "react";
import { DualCta, SECTION_SHELL, SectionHeading } from "@/components/lp/ui";
import {
  IconChart,
  IconCheck,
  IconQuote,
  IconScreenshot,
} from "@/components/lp/icons";

interface Proof {
  title: string;
  copy: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}

const PROOF: Proof[] = [
  {
    title: "Verified campaign screenshots",
    copy: "Pulled straight from the ad platforms — real spend, real delivery, never a mockup.",
    Icon: IconScreenshot,
  },
  {
    title: "Real customer testimonials",
    copy: "Named dealership voices describing the difference, in their own words.",
    Icon: IconQuote,
  },
  {
    title: "Dealership CRM outcomes",
    copy: "Measured against your own system of record — the source of truth your team already trusts.",
    Icon: IconChart,
  },
];

export function ProofMethod(): ReactElement {
  return (
    <section id="proof-method" className="py-20 md:py-28">
      <div className={`${SECTION_SHELL} grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16`}>
        <div>
          <SectionHeading
            eyebrow="Our Proof Standard"
            title={
              <>
                We believe in{" "}
                <span className="text-lp-cyan">showing the receipts</span>
              </>
            }
            intro="We don't ask you to take our word for it. When we work with a dealership, proof comes from evidence you can verify — not a vanity dashboard or a borrowed case study."
          />
          <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-lp-muted">
            During your free audit we&apos;ll walk you through exactly what that
            proof looks like and how we&apos;d measure success for a store like
            yours.
          </p>

          {/* Approved sample: the human follow-up behind the proof — a BDC
              specialist working a shopper conversation, not a data claim. */}
          <figure className="mt-8 overflow-hidden rounded-[16px] border border-lp-border/70 bg-lp-panel/40 shadow-[0_24px_70px_-30px_rgba(3,10,24,0.9)]">
            <Image
              src="/lp/bdc-team-follow-up.webp"
              alt="A BDC Promotions specialist following up with a car shopper by phone at a dealership"
              width={1248}
              height={832}
              sizes="(min-width: 1024px) 520px, 100vw"
              className="h-auto w-full"
            />
          </figure>
        </div>

        {/* Evidence board — describes the proof standard; no fabricated data. */}
        <ul className="flex flex-col gap-4">
          {PROOF.map(({ title, copy, Icon }) => (
            <li
              key={title}
              className="flex items-start gap-4 rounded-[14px] border border-lp-border/70 bg-lp-panel/55 p-5 transition-colors duration-200 hover:border-lp-cyan/50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-lp-cyan/30 bg-lp-cyan/[0.08] text-lp-cyan">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-lp-success" />
                  <h3 className="font-display text-[1.15rem] font-bold uppercase tracking-[0.01em] text-lp-text">
                    {title}
                  </h3>
                </div>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-lp-muted">
                  {copy}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${SECTION_SHELL} mt-14`}>
        <DualCta label="See What Your Marketing Is Missing" />
      </div>
    </section>
  );
}
