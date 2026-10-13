"use client";

import { useEffect } from "react";

const EASE_MS = 700;
const STEP_MS = 70;

/**
 * Scroll reveals for the homepage sections below the hero. Mounted on the page
 * (not the shared layout), and it only hides sections that start below the
 * window, so nothing already on screen flashes, and without JS everything shows.
 */
export function HomeMotion(): null {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-motion-root]");
    if (!root || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const reveal = (section: HTMLElement) => {
      section.dataset.motion = "in";
      // Hand the elements back their own transitions (hover states) once the reveal ends.
      const last = Number(section.dataset.motionItems ?? 0) * STEP_MS + EASE_MS + 100;
      window.setTimeout(() => {
        section.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          el.removeAttribute("data-reveal");
          el.style.removeProperty("--motion-delay");
        });
      }, last);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        reveal(entry.target as HTMLElement);
      }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

    const sections = [...root.querySelectorAll<HTMLElement>(":scope > section")].slice(1); // the hero has its own entrance
    for (const section of sections) {
      if (section.getBoundingClientRect().top < window.innerHeight) continue;
      const frame = section.firstElementChild;
      if (!frame) continue;
      const items: HTMLElement[] = [];
      for (const child of frame.children) {
        if (child instanceof SVGSVGElement) child.setAttribute("data-route", "");
        else if (/^(UL|OL|DL)$/.test(child.tagName)) items.push(...(child.children as HTMLCollectionOf<HTMLElement>));
        else items.push(child as HTMLElement);
      }
      items.forEach((el, i) => {
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--motion-delay", `${Math.min(i, 8) * STEP_MS}ms`);
      });
      section.dataset.motionItems = String(Math.min(items.length, 9));
      section.dataset.motion = "pending";
      observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);
  return null;
}
