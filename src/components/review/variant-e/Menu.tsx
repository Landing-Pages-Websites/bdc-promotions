"use client";

import { useRef, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from "react";

// The ≤960px menu is a <details>: opening it, the full-width sheet and the "Close" label are CSS.
// This wrapper only closes it when one of its links is followed (the sheet would otherwise stay
// over the section it just scrolled to) or when Escape is pressed.
export function MenuSheet({ className, children }: { className: string; children: ReactNode }): ReactElement {
  const ref = useRef<HTMLDetailsElement>(null);
  const onClick = (e: MouseEvent<HTMLDetailsElement>): void => {
    if (ref.current && (e.target as Element).closest("a")) ref.current.open = false;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDetailsElement>): void => {
    if (e.key !== "Escape" || !ref.current?.open) return;
    ref.current.open = false;
    ref.current.querySelector("summary")?.focus();
  };
  return (
    <details ref={ref} className={className} onClick={onClick} onKeyDown={onKeyDown}>
      {children}
    </details>
  );
}
