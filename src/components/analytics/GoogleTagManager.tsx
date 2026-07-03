"use client";

import Script from "next/script";
import type { ReactElement } from "react";
import { useConsent } from "@/components/consent/useConsent";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * GTM container loader (script + noscript). Renders nothing until
 * NEXT_PUBLIC_GTM_ID is set AND the visitor has accepted cookies.
 */
export function GoogleTagManager(): ReactElement | null {
  const { status } = useConsent();

  if (!GTM_ID || status !== "accepted") {
    return null;
  }

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
