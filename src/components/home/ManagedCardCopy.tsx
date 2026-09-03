import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import type { ContentCard } from "./LandingPage";

interface ManagedCardCopyProps {
  item: ContentCard;
}

export function ManagedCardCopy({ item }: ManagedCardCopyProps): ReactElement {
  return (
    <>
      <h3 {...managedSiteFieldAttributesV1(item.title.fieldId, item.itemId)}>
        {item.title.value}
      </h3>
      <p
        {...managedSiteFieldAttributesV1(item.description.fieldId, item.itemId)}
      >
        {item.description.value}
      </p>
    </>
  );
}
