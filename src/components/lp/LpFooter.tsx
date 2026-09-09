import Image from "next/image";
import type { ReactElement } from "react";
import { SECTION_SHELL } from "@/components/lp/ui";

/*
 * Legal-only footer — copyright + Privacy Policy / Terms links ONLY.
 * No nav, no social, no outbound portfolio links (LP hard rule).
 */
export function LpFooter(): ReactElement {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-lp-border/70 bg-lp-ink py-10">
      <div className={`${SECTION_SHELL} flex flex-col items-center gap-5 sm:flex-row sm:justify-between`}>
        <div className="flex items-center gap-2.5">
          <Image
            src="/lp/bdc-logo.png"
            alt="BDC Promotions"
            width={28}
            height={28}
            className="h-7 w-7 rounded-[7px] border border-white/15 bg-lp-panel object-contain p-0.5"
          />
          <p className="text-[0.85rem] text-lp-muted">
            © {year} BDC Promotions Inc. All rights reserved.
          </p>
        </div>
        <nav aria-label="Legal" className="flex items-center gap-6">
          <a
            href="/privacy-policy"
            className="text-[0.85rem] font-medium text-lp-cyan transition-colors hover:text-lp-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-text"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-[0.85rem] font-medium text-lp-cyan transition-colors hover:text-lp-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-text"
          >
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
