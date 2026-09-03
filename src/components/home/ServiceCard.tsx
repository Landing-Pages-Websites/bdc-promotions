import type { ReactElement } from "react";
import { formatSequenceNumber } from "@/lib/formatSequenceNumber";

import type { ContentCard } from "./LandingPage";
import { ManagedCardCopy } from "./ManagedCardCopy";

interface ServiceCardProps {
  index: number;
  item: ContentCard;
}

export function ServiceCard({ index, item }: ServiceCardProps): ReactElement {
  return (
    <article className="service-card">
      <div className="service-card__topline">
        <span className="service-card__index">
          {formatSequenceNumber(index)}
        </span>
        <span aria-hidden="true">Service</span>
      </div>
      <ManagedCardCopy item={item} />
      <div className="service-card__meter" aria-hidden="true">
        <span />
      </div>
    </article>
  );
}
