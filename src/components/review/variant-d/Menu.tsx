"use client";

import type { KeyboardEvent, MouseEvent, ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./chrome.module.css";
import { navLinks } from "./ui";

// A <details> sheet stays open after an in-page jump; close it when any of its links is followed.
const shut = (e: MouseEvent<HTMLAnchorElement>): void => {
  e.currentTarget.closest("details")?.removeAttribute("open");
};

// Escape closes the open sheet and returns focus to its toggle.
const onEscape = (e: KeyboardEvent<HTMLDetailsElement>): void => {
  if (e.key !== "Escape" || !e.currentTarget.open) return;
  e.currentTarget.open = false;
  e.currentTarget.querySelector("summary")?.focus();
};

/* ≤1100: a full-width sheet under the header, with a Close state and the audit action last (V212). */
export function Menu(): ReactElement {
  return (
    <details className={s.menu} onKeyDown={onEscape}>
      <summary><i aria-hidden="true" /><span className={s.whenShut}>Menu</span><span className={s.whenOpen}>Close</span></summary>
      <nav aria-label="Mobile">
        {navLinks.map(([href, text]) => <a key={href} href={href} onClick={shut}>{text}</a>)}
        <a href={phoneHref} onClick={shut} aria-label={`Call BDC Promotions at ${phoneDisplay}`}>Call {phoneDisplay}</a>
        <a className={`${b.btn} ${b.btnBlue} ${s.sheetBtn}`} href={auditHref} onClick={shut}>Free audit</a>
      </nav>
    </details>
  );
}
