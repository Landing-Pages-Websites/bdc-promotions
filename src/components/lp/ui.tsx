import type { ReactElement, ReactNode } from "react";
import {
  FORM_ANCHOR,
  PHONE_CTA,
  PHONE_HREF,
  PRIMARY_CTA,
} from "@/components/lp/constants";
import { IconArrowRight, IconPhone } from "@/components/lp/icons";

/*
 * LP button + label primitives. All CTAs are anchors (either the in-page form
 * anchor or the tel: href), so a single anchor-based button covers every case.
 * Renders the full state set from `component_stylings`: gradient fill / hover
 * lift + glow / 2px white focus outline / active blue.
 */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-text focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink";

// Compact responsive padding/type so a primary + phone pair fits side-by-side
// at 390px without overflow, then relaxes to full size from sm up.
const PRIMARY_BTN =
  "group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-lp-cyan to-lp-blue px-4 py-3 text-center font-display text-[0.9rem] font-extrabold uppercase tracking-[0.02em] text-[#03101b] shadow-[0_12px_34px_rgba(14,112,255,0.28)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:from-lp-cyan hover:to-lp-cyan hover:shadow-[0_18px_46px_rgba(25,200,255,0.42)] active:translate-y-0 active:from-lp-active active:to-lp-active sm:min-h-[52px] sm:gap-2.5 sm:px-6 sm:py-3.5 sm:text-[1.02rem] " +
  FOCUS;

// Less-prominent than the filled primary: bordered/ghost surface, same footprint.
const SECONDARY_BTN =
  "group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[10px] border border-lp-border bg-white/[0.04] px-4 py-3 text-center font-display text-[0.9rem] font-bold uppercase tracking-[0.02em] text-lp-text transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-lp-cyan hover:text-lp-cyan active:translate-y-0 sm:min-h-[52px] sm:gap-2.5 sm:px-6 sm:py-3.5 sm:text-[1.02rem] " +
  FOCUS;

export function PrimaryCtaButton({
  className = "",
  label = PRIMARY_CTA,
}: {
  className?: string;
  label?: string;
}): ReactElement {
  return (
    <a href={FORM_ANCHOR} className={`${PRIMARY_BTN} ${className}`}>
      {label}
      <IconArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
    </a>
  );
}

export function PhoneCtaButton({
  className = "",
}: {
  className?: string;
}): ReactElement {
  return (
    <a
      href={PHONE_HREF}
      className={`${SECONDARY_BTN} ${className}`}
      aria-label={`Call BDC Promotions at ${PHONE_CTA.replace("Call ", "")}`}
    >
      <IconPhone className="h-[18px] w-[18px]" />
      {PHONE_CTA}
    </a>
  );
}

/**
 * The dual conversion action — centered, side-by-side form + phone CTA.
 * Repeated at the end of every content section per the LP hard rules. Always a
 * horizontal row (never `flex-col`): at 390px the two actions share the row via
 * `flex-1`, then size to content from sm up. The filled primary and the ghost
 * phone action stay visually distinct.
 */
export function DualCta({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}): ReactElement {
  return (
    <div
      className={`flex items-stretch justify-center gap-2.5 sm:gap-3 ${className}`}
    >
      <PrimaryCtaButton label={label} className="min-w-0 flex-1 sm:flex-none" />
      <PhoneCtaButton className="min-w-0 flex-1 sm:flex-none" />
    </div>
  );
}

/** Standard section container width (1180px, 24px mobile gutters). */
export const SECTION_SHELL = "mx-auto w-[min(1180px,calc(100%-2rem))]";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
}): ReactElement {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 font-display font-bold uppercase leading-[0.96] tracking-[-0.005em] text-lp-text [font-size:clamp(2.2rem,4.2vw,3.6rem)]">
        {title}
      </h2>
      {intro ? (
        <p className="mt-5 text-[1.02rem] leading-relaxed text-lp-muted">
          {intro}
        </p>
      ) : null}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }): ReactElement {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-lp-cyan/30 bg-lp-cyan/[0.08] px-3.5 py-1.5 font-display text-[0.72rem] font-bold uppercase tracking-[0.22em] text-lp-cyan">
      <span className="h-1.5 w-1.5 rounded-full bg-lp-cyan shadow-[0_0_8px_rgba(25,200,255,0.9)]" />
      {children}
    </span>
  );
}
