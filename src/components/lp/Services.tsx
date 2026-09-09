import Image from "next/image";
import type { ReactElement, SVGProps } from "react";
import { DualCta, SECTION_SHELL, SectionHeading } from "@/components/lp/ui";
import {
  IconCalendar,
  IconMegaphone,
  IconQuote,
  IconReels,
  IconTarget,
} from "@/components/lp/icons";

interface Service {
  name: string;
  copy: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  wide?: boolean;
}

const SERVICES: Service[] = [
  {
    name: "New-car lead generation",
    copy: "Paid social campaigns built to put your new-car inventory in front of in-market shoppers and start real conversations your BDC team can follow up on.",
    Icon: IconTarget,
    wide: true,
  },
  {
    name: "Inventory ads",
    copy: "Turn the vehicles on your lot into scroll-stopping ads that move specific units — not just rack up impressions.",
    Icon: IconMegaphone,
  },
  {
    name: "Event ads",
    copy: "Fill your sales events and seasonal pushes with campaigns designed to drive foot traffic and appointments.",
    Icon: IconCalendar,
  },
  {
    name: "Reels & value-proposition videos",
    copy: "Short-form video that tells shoppers why your store — the reasons to buy from you, delivered in their feed.",
    Icon: IconReels,
  },
  {
    name: "Testimonial videos",
    copy: "Real customer stories, produced to build trust before a shopper ever walks onto your lot.",
    Icon: IconQuote,
  },
];

export function Services(): ReactElement {
  return (
    <section id="services" className="border-y border-lp-border/60 bg-lp-panel/30 py-20 md:py-28">
      <div className={SECTION_SHELL}>
        {/* Asymmetric intro: heading holds the left rail, an approved sample of
            our inventory-ad production anchors the right. */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <SectionHeading
            eyebrow="Automotive Marketing Services"
            title={
              <>
                Everything paid social should do for a{" "}
                <span className="text-lp-cyan">dealership</span>
              </>
            }
            intro="Five services, built for how cars actually get sold today. Each one is scoped to a real dealership outcome — not a generic marketing deliverable."
          />
          <figure className="overflow-hidden rounded-[16px] border border-lp-border/70 bg-lp-panel/40 shadow-[0_24px_70px_-30px_rgba(3,10,24,0.9)]">
            <Image
              src="/lp/bdc-inventory-production.webp"
              alt="BDC Promotions marketers building paid-social inventory ads from a dealership's vehicle lineup"
              width={1248}
              height={832}
              sizes="(min-width: 1024px) 520px, 100vw"
              className="h-auto w-full"
            />
          </figure>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ name, copy, Icon, wide }) => (
            <li
              key={name}
              className={`group flex flex-col rounded-[14px] border border-lp-border/70 bg-lp-panel/60 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-lp-cyan/50 hover:bg-lp-panel ${
                wide ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-[11px] border border-lp-cyan/30 bg-lp-cyan/[0.08] text-lp-cyan transition-colors group-hover:bg-lp-cyan/15">
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="mt-5 font-display text-[1.35rem] font-bold uppercase leading-tight tracking-[0.005em] text-lp-text">
                {name}
              </h3>
              <p
                className={`mt-2.5 text-[0.96rem] leading-relaxed text-lp-muted ${
                  wide ? "max-w-lg" : ""
                }`}
              >
                {copy}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-14">
          <DualCta />
        </div>
      </div>
    </section>
  );
}
