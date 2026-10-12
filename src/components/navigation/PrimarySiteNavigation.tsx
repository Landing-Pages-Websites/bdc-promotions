import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { siteRoutes } from "@/lib/routes";
import { primaryNavigation } from "@/lib/site-navigation";

const navigationRoutes = siteRoutes.filter(
  ({ path }) => path !== "/" && path !== "/thank-you",
);
const linkClassName =
  "inline-flex min-h-11 items-center underline underline-offset-4 hover:text-[color:var(--cyan)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--cyan)]";

/** Navigation shell used only by legal pages and legacy article templates. */
export function PrimarySiteNavigation({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <>
      <a href="#page-content" className="skip-link">Skip page navigation</a>
      <header className="mx-auto w-full max-w-2xl px-6 pt-8">
        <nav aria-label="Primary navigation" className="flex flex-wrap gap-x-6 text-sm">
          <Link href="/" className={linkClassName}>Home</Link>
          {primaryNavigation.map(([href, label]) => <Link key={href} href={href} className={linkClassName}>{label}</Link>)}
        </nav>
      </header>
      <main id="page-content" tabIndex={-1}>{children}</main>
      <footer className="mx-auto w-full max-w-2xl px-6 pb-12">
        <nav aria-label="Primary site pages" className="border-t border-[color:var(--line)] pt-6 text-sm text-[color:var(--muted)]">
          <ul className="flex flex-wrap gap-x-6">
            {navigationRoutes.map(({ path, title }) => (
              <li key={path} className="min-w-0 max-w-full break-words">
                <Link href={path} className={linkClassName}>{title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </footer>
    </>
  );
}
