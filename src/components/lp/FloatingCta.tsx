"use client";

import { useEffect, useState, type ReactElement } from "react";
import { FORM_ANCHOR, PRIMARY_CTA } from "@/components/lp/constants";
import { IconArrowRight } from "@/components/lp/icons";

/*
 * Floating conversion CTA — FORM-ONLY (no phone), appears after the hero, and
 * hides again once the lower form is on screen so it never covers it.
 */
export function FloatingCta(): ReactElement | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const form = document.getElementById("get-started");
    let pastHero = false;
    let formInView = false;

    const update = (): void => setVisible(pastHero && !formInView);

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        pastHero = !entry.isIntersecting;
        update();
      },
      { rootMargin: "-60px 0px 0px 0px" },
    );
    const formObserver = new IntersectionObserver(
      ([entry]) => {
        formInView = entry.isIntersecting;
        update();
      },
      { threshold: 0.15 },
    );

    if (hero) heroObserver.observe(hero);
    if (form) formObserver.observe(form);
    return () => {
      heroObserver.disconnect();
      formObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 transition-all duration-300 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <a
        href={FORM_ANCHOR}
        tabIndex={visible ? 0 : -1}
        className="group inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2.5 rounded-[12px] bg-gradient-to-br from-lp-cyan to-lp-blue px-6 py-3.5 font-display text-[1.02rem] font-extrabold uppercase tracking-[0.02em] text-[#03101b] shadow-[0_16px_44px_rgba(14,112,255,0.5)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-text focus-visible:ring-offset-2 focus-visible:ring-offset-lp-ink"
      >
        {PRIMARY_CTA}
        <IconArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
      </a>
    </div>
  );
}
