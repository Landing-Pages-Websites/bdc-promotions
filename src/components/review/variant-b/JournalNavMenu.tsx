"use client";

import type { FocusEvent, ReactElement } from "react";
import n from "./journal-nav.module.css";

const navItems = [
  ["Services", "#b-options"],
  ["Creative", "#b-work"],
  ["Follow-up", "#b-growth"],
  ["Resources", "#b-faq"],
  ["About", "#b-proof"],
] as const;

/*
 * On phones the links are a horizontal scroll strip. Chromium leaves a half-visible link where it
 * is when Tab focuses it; "nearest" brings it fully in, and the strip's scroll-padding keeps it
 * clear of the edge fade. No-op when the link is already in view (and on desktop, no scroller).
 */
function reveal(event: FocusEvent<HTMLElement>): void {
  event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
}

export function JournalNavMenu(): ReactElement {
  return (
    <nav aria-label="Dealer Field Journal sections" className={n.menu} onFocus={reveal}>
      <ul>
        {navItems.map(([label, href]) => (
          <li key={label}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
