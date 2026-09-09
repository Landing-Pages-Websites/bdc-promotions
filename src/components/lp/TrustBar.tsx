import type { ReactElement } from "react";
import { SECTION_SHELL } from "@/components/lp/ui";
import {
  IconClock,
  IconSignal,
  IconTarget,
  IconChart,
} from "@/components/lp/icons";

const PILLARS = [
  {
    label: "Fast",
    copy: "Creative and campaigns that move at dealership speed.",
    Icon: IconClock,
  },
  {
    label: "Focused",
    copy: "Automotive only — never a generic agency playbook.",
    Icon: IconTarget,
  },
  {
    label: "Social",
    copy: "Built for how today's shoppers actually scroll.",
    Icon: IconSignal,
  },
  {
    label: "Results",
    copy: "Measured on appointments and sales opportunities.",
    Icon: IconChart,
  },
] as const;

export function TrustBar(): ReactElement {
  return (
    <section id="trust-bar" className="border-y border-lp-border/60 bg-lp-panel/40">
      <div className={`${SECTION_SHELL} grid grid-cols-1 gap-8 py-12 lg:grid-cols-12 lg:items-center`}>
        <div className="lg:col-span-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[3.4rem] font-extrabold leading-none text-lp-cyan">
              15
            </span>
            <span className="font-display text-[1.1rem] font-bold uppercase leading-tight tracking-[0.1em] text-lp-text">
              Years
            </span>
          </div>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-lp-muted">
            Spent exclusively on automotive marketing for dealerships.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-4 lg:col-span-9 lg:grid-cols-4">
          {PILLARS.map(({ label, copy, Icon }) => (
            <li
              key={label}
              className="rounded-[12px] border border-lp-border/70 bg-lp-panel/60 p-4 transition-colors duration-200 hover:border-lp-cyan/50"
            >
              <Icon className="h-7 w-7 text-lp-cyan" />
              <p className="mt-3 font-display text-[1.05rem] font-bold uppercase tracking-[0.06em] text-lp-text">
                {label}
              </p>
              <p className="mt-1.5 text-[0.85rem] leading-snug text-lp-muted">
                {copy}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
