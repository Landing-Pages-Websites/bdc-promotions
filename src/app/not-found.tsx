import Link from "next/link";
import type { ReactElement } from "react";
import { InteriorPage } from "@/components/signal-lane/InteriorPage";
import shared from "@/components/signal-lane/interior-page.module.css";
import { siteRoutes } from "@/lib/routes";
import { siteConfig } from "@/site.config";

export default function NotFound(): ReactElement {
  const keyPages = siteRoutes.filter(
    (route) => !route.hideFromKeyPages && route.path !== "/",
  );

  return (
    <InteriorPage
      path="/404"
      title="Page not found"
      intro={`That page does not exist on the ${siteConfig.businessName} site. It may have moved, or the link may be out of date.`}
      chapters={[]}
    >
      <section className={shared.related}>
        <div className={`${shared.container} ${shared.relatedLayout} ${shared.keyPages}`}>
          <Link className={shared.textLink} href="/">Back to home<span aria-hidden="true">→</span></Link>
          {keyPages.length > 0 ? (
            <nav aria-label="Key pages">
              <ul>
                {keyPages.map((route) => (
                  <li key={route.path}>
                    <Link href={route.path}>{route.title}<span aria-hidden="true">→</span></Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </section>
    </InteriorPage>
  );
}
