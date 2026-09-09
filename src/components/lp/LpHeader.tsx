"use client";

import Image from "next/image";
import { useEffect, useState, type ReactElement } from "react";
import {
  FORM_ANCHOR,
  PHONE_DISPLAY,
  PHONE_HREF,
  PRIMARY_CTA,
} from "@/components/lp/constants";
import { IconArrowRight, IconPhone } from "@/components/lp/icons";

/*
 * Conversion header: logo + styled phone/form buttons, NO nav links.
 * Blurred navy bar by default; opaque navy once scrolled.
 */
export function LpHeader(): ReactElement {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        scrolled
          ? "border-lp-border bg-lp-ink/95 backdrop-blur-md"
          : "border-white/10 bg-lp-ink/60 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-[72px] w-[min(1180px,calc(100%-2rem))] items-center justify-between gap-4">
        <a
          href="#hero"
          className="flex items-center gap-2.5"
          aria-label="BDC Promotions home"
        >
          <Image
            src="/lp/bdc-logo.png"
            alt="BDC Promotions"
            width={40}
            height={40}
            priority
            className="h-9 w-9 rounded-[9px] border border-white/15 bg-lp-panel object-contain p-0.5"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.05rem] font-extrabold tracking-[0.01em] text-lp-text">
              BDC Promotions
            </span>
            <span className="mt-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-lp-muted">
              Automotive Marketing
            </span>
          </span>
        </a>

        <div className="flex items-center gap-2.5">
          <a
            href={PHONE_HREF}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-lp-border bg-white/[0.04] px-3.5 py-2 font-display text-[0.9rem] font-bold uppercase tracking-[0.03em] text-lp-text transition-colors hover:border-lp-cyan hover:text-lp-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-text"
            aria-label={`Call BDC Promotions at ${PHONE_DISPLAY}`}
          >
            <IconPhone className="h-[17px] w-[17px]" />
            <span className="hidden sm:inline">{PHONE_DISPLAY}</span>
            <span className="sm:hidden">Call</span>
          </a>
          <a
            href={FORM_ANCHOR}
            className="group inline-flex min-h-[44px] items-center gap-2 rounded-[10px] bg-gradient-to-br from-lp-cyan to-lp-blue px-4 py-2 font-display text-[0.9rem] font-extrabold uppercase tracking-[0.03em] text-[#03101b] shadow-[0_8px_24px_rgba(14,112,255,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(25,200,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-text focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink"
          >
            <span className="hidden md:inline">{PRIMARY_CTA}</span>
            <span className="md:hidden">Free Audit</span>
            <IconArrowRight className="h-[16px] w-[16px] transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
