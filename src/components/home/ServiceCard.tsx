import type { ReactElement } from "react";

import { formatSequenceNumber } from "@/lib/formatSequenceNumber";

import type { ContentCard } from "./LandingPage";

interface ServiceCardProps {
  index: number;
  item: ContentCard;
  label: string;
}

export function ServiceCard({
  index,
  item,
  label,
}: ServiceCardProps): ReactElement {
  return (
    <article className="service-card">
      <div className="service-card__topline">
        <span className="service-card__index">
          {formatSequenceNumber(index)}
        </span>
        <span>{label}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <div className="service-card__meter" aria-hidden="true">
        <span />
      </div>
    </article>
  );
}
