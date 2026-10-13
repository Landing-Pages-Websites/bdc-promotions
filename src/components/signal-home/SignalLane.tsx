import type { ReactElement } from "react";
import { SiteFooter, SiteHeader } from "@/components/signal-lane/SiteChrome";
import { Close } from "./Close";
import { fontVariables } from "./fonts";
import { Growth } from "./Growth";
import { Hero } from "./Hero";
import { HomeMotion } from "./HomeMotion";
import { Options } from "./Options";
import { Proof } from "./Proof";
import { Signal } from "./Signal";
import { Work } from "./Work";
import styles from "./signal-lane.module.css";

/**
 * The customer-approved homepage (direction A, "Signal Lane"), wrapped in the
 * same header and footer as every other page. The header aligns to this page's
 * edge-to-edge frame (`wide`) instead of the interior 1180px column.
 */
export function SignalLane(): ReactElement {
  return (
    <div data-surface="signal-lane" className={styles.site}>
      <SiteHeader path="/" wide />
      <main id="main-content" tabIndex={-1} data-motion-root className={`${fontVariables} ${styles.page}`}>
        <Hero />
        <Signal />
        <Growth />
        <Work />
        <Proof />
        <Options />
        <Close />
      </main>
      <SiteFooter path="/" wide />
      <HomeMotion />
    </div>
  );
}
