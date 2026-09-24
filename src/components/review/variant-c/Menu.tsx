"use client";

import { useEffect, useRef, type ReactElement } from "react";
import s from "./chrome.module.css";

type Anchor = readonly [label: string, href: string];

/* ≤1100 menu (fix r2, V212): a full-width sheet under the bar with a "Close" state. <details> keeps it working
   without JS; the script only closes it on an anchor tap, Escape, or a tap outside the sheet. */
export function Menu({ anchors }: { anchors: ReadonlyArray<Anchor> }): ReactElement {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const d = ref.current;
      if (e.key !== "Escape" || !d?.open) return;
      d.open = false;
      d.querySelector("summary")?.focus();
    };
    const onDown = (e: PointerEvent): void => {
      const d = ref.current;
      if (d?.open && !d.contains(e.target as Node)) d.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const close = (): void => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details ref={ref} className={s.menu}>
      <summary>
        <span className={s.whenShut}>Menu</span>
        <span className={s.whenOpen}>Close</span>
      </summary>
      <div className={s.menuPanel}>
        {anchors.map(([label, href]) => (
          <a key={href} href={href} onClick={close}>
            {label}
          </a>
        ))}
      </div>
    </details>
  );
}
