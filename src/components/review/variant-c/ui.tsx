import type { ReactElement } from "react";
import b from "./base.module.css";

export const email = "justins@bdc-promotions.com";

/** The round arrow badge that ends every primary button (white on the blue fill). */
export function ArrowBadge(): ReactElement {
  return (
    <span className={b.badge} aria-hidden="true">
      <svg viewBox="0 0 16 16">
        <path d="M4 12L12 4M6 4h6v6" />
      </svg>
    </span>
  );
}
