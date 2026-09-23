import type { ReactElement, ReactNode } from "react";
import { auditHref, phoneDisplay, phoneHref, serviceOptions } from "../content";
import { serviceIndexes, splitPrice, type ServiceIndex } from "./ads";
import s from "./proof-wall.module.css";
import f from "./fold.module.css";

export function Eyebrow({ children, tone = "steel" }: { children: ReactNode; tone?: "steel" | "fog" }): ReactElement {
  return <p className={`${s.eyebrow} ${s[tone]}`}>{children}</p>;
}

/** One primary pill + the phone as a text link on its own line under it (never a second pill), so its
    place is the same at every width. The arrow is part of the label's last word, so a wrapped label
    stays one centred block with no floating arrow. */
export function Actions({ className = "" }: { className?: string }): ReactElement {
  return (
    <div className={`${s.actions} ${className}`}>
      <a className={`${s.pill} ${s.pillRed}`} href={auditHref}>
        <span>Get a free dealership marketing audit{" "}→</span>
      </a>
      <a className={s.callLink} href={phoneHref}>
        or call <span className={s.nowrap}>{phoneDisplay}</span>
      </a>
    </div>
  );
}

/** Amount + "/ month" as one unbreakable unit. */
export function Price({ index, className = "" }: { index: ServiceIndex; className?: string }): ReactElement {
  const [amount, unit] = splitPrice(index);
  return (
    <span className={`${s.price} ${className}`}>
      {amount}
      {unit ? <span className={s.per}> {unit}</span> : null}
    </span>
  );
}

/** The single window sticker, portrait like a real one: graphite band, four ruled rows (name over
    price, "/ month" beside each price), the verified non-guarantee. Terms live in the pricing ledger
    below. All four rows are identical in treatment: no highlight (V8). */
export function PriceSticker(): ReactElement {
  return (
    <div className={f.sticker}>
      <p className={f.stickerBand}>Services &amp; pricing</p>
      <ul className={f.stickerRows}>
        {serviceIndexes.map((i) => {
          const [name] = serviceOptions[i];
          return (
            <li key={name}>
              <span className={f.stickerName}>{name}</span>
              <Price index={i} className={f.stickerPrice} />
            </li>
          );
        })}
      </ul>
      <p className={f.stickerNote}>No specific lead, appointment, show, or sales result is guaranteed.</p>
    </div>
  );
}
