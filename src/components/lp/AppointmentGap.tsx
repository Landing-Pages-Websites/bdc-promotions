import Image from "next/image";
import type { ReactElement } from "react";
import { DualCta, SECTION_SHELL, SectionHeading } from "@/components/lp/ui";
import { IconArrowRight } from "@/components/lp/icons";

const VANITY = ["Impressions", "Clicks", "Raw form fills"] as const;
const REAL = [
  "Real shopper conversations",
  "Booked showroom appointments",
  "Sales opportunities your team can work",
] as const;

export function AppointmentGap(): ReactElement {
  return (
    <section id="appointment-gap" className="py-20 md:py-28">
      <div className={`${SECTION_SHELL} grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16`}>
        <div>
          <SectionHeading
            eyebrow="The Appointment Gap"
            title={
              <>
                Impressions don&apos;t sell cars.{" "}
                <span className="text-lp-cyan">Conversations do.</span>
              </>
            }
            intro="Most dealership social spend buys reach and raw leads that never reach the sales floor. The number that grows on the dashboard has nothing to do with the number of people sitting across from your closers."
          />
          <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-lp-muted">
            BDC Promotions is built to close that gap — converting paid
            attention into real conversations, booked appointments, and showroom
            opportunities, then measuring the work on what your CRM actually
            records.
          </p>
        </div>

        {/* Editorial contrast panel — no fabricated numbers, structure only. */}
        <div className="rounded-[16px] border border-lp-border/70 bg-lp-panel/50 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <div className="rounded-[12px] border border-lp-border/60 bg-lp-ink/50 p-5">
              <p className="font-display text-[0.72rem] font-bold uppercase tracking-[0.16em] text-lp-muted">
                What most campaigns deliver
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {VANITY.map((item) => (
                  <li
                    key={item}
                    className="text-[0.95rem] text-lp-muted line-through decoration-lp-error/60 decoration-1"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-center sm:flex-col">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-lp-cyan/40 bg-lp-cyan/10 text-lp-cyan">
                <IconArrowRight className="h-5 w-5" />
              </span>
            </div>

            <div className="rounded-[12px] border border-lp-cyan/40 bg-lp-cyan/[0.06] p-5">
              <p className="font-display text-[0.72rem] font-bold uppercase tracking-[0.16em] text-lp-cyan">
                What we build toward
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {REAL.map((item) => (
                  <li
                    key={item}
                    className="text-[0.95rem] font-medium text-lp-text"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/*
        Illustrative campaign creative — an approved BDC Promotions sample of
        the paid-social creative + appointment-focused reporting we build for
        dealerships. Presented as an example of the work (not this prospect's
        results), so no specific figures are claimed as fact in the copy.
      */}
      <figure className={`${SECTION_SHELL} mt-16`}>
        <div className="overflow-hidden rounded-[18px] border border-lp-border/70 bg-lp-panel/40 shadow-[0_30px_80px_-30px_rgba(3,10,24,0.9)]">
          <Image
            src="/lp/appointment-gap.webp"
            alt="Sample BDC Promotions dealership campaign: paid-social creative alongside an appointment-and-opportunity reporting view"
            width={1400}
            height={933}
            sizes="(min-width: 1024px) 1100px, 100vw"
            className="h-auto w-full"
          />
        </div>
        <figcaption className="mt-3 text-center text-[0.8rem] leading-relaxed text-lp-muted/80">
          Illustrative example of BDC Promotions creative and
          appointment-focused reporting — your audit shows what this looks like
          for your store.
        </figcaption>
      </figure>

      <div className={`${SECTION_SHELL} mt-14`}>
        <DualCta label="Request My Free Consultation" />
      </div>
    </section>
  );
}
