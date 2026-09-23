import type { ReactElement } from "react";
import styles from "./signal-lane.module.css";

// Desktop keeps the image's exact line breaks; below the desktop breakpoint the lines reflow.
// Compounds that must not split when lines reflow use U+2011 (same glyph as "-" in A's fonts).
export function Lines({ lines }: { lines: readonly string[] }): ReactElement {
  return (
    <>
      {lines.map((text, index) => (
        <span className={styles.line} key={text}>
          {text}
          {index < lines.length - 1 && !text.endsWith("-") ? " " : null}
        </span>
      ))}
    </>
  );
}
