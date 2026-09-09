"use client";

import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";

/*
 * Renders its children on the primary website only, never on the paid LP
 * (`/lp`). The LP ships its OWN isolated tracking (its own MegaTag siteKey,
 * GTM, and Meta Pixel via the optimizer config in `src/app/lp/layout.tsx`);
 * letting the primary site's optimizer + analytics also load there would
 * double-fire and attribute LP conversions to the wrong site.
 *
 * This only ever suppresses on the /lp route — every existing primary route
 * renders exactly as before, so current production behavior is unchanged.
 */
export function PrimaryRouteOnly({
  children,
}: {
  children: ReactNode;
}): ReactElement | null {
  const pathname = usePathname();
  if (pathname === "/lp" || pathname?.startsWith("/lp/")) {
    return null;
  }
  return <>{children}</>;
}
