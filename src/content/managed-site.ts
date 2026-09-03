import {
  ManagedSiteContractError,
  createManagedSiteNextV1,
  type ManagedCollectionDescriptor,
  type ManagedCollectionItemField,
  type ManagedContentOwner,
  type ManagedFieldDescriptor,
  type ManagedInternalProtectedField,
  type ManagedInternalValueType,
  type ManagedSiteContentValue,
  type StableId,
} from "@landing-pages-websites/managed-site-contract";

import contractDocument from "./managed-site.contract.json";
import homeDocument from "./pages/home.json";
import siteDocument from "./site.json";

const HOME_PATH = "src/content/pages/home.json";
const SITE_PATH = "src/content/site.json";

const managedSite = createManagedSiteNextV1({
  contract: contractDocument,
  sourceDocuments: [
    { path: HOME_PATH, value: homeDocument },
    { path: SITE_PATH, value: siteDocument },
  ],
});

type RenderedTextType = "plain_text" | "heading_text";
type InternalValue = Extract<
  ManagedSiteContentValue,
  { readonly type: "internal_protected" }
>;
type InternalValueByType<Type extends ManagedInternalValueType> = Extract<
  InternalValue,
  { readonly valueType: Type }
>;

function fail(message: string): never {
  throw new ManagedSiteContractError("STARTER_MANAGED_SITE_INVALID", message);
}

function only<T>(values: readonly T[], description: string): T {
  if (values.length !== 1) {
    return fail(`Expected one ${description}; received ${values.length}`);
  }
  return values[0];
}

function hasResolver(
  field: ManagedFieldDescriptor | ManagedInternalProtectedField,
  path: string,
  pointer: string,
): boolean {
  return field.resolver.path === path && field.resolver.pointer === pointer;
}

function homePage() {
  return only(
    managedSite.contract.pages.filter(
      (page) => page.route.kind === "static" && page.route.path === "/",
    ),
    "managed home page",
  );
}

const page = homePage();
const pageOwner: ManagedContentOwner = Object.freeze({
  kind: "page",
  pageId: page.id,
});
const siteOwner: ManagedContentOwner = Object.freeze({ kind: "site" });
const pageFields = page.sections.flatMap((section) => section.fields);

function renderedField(
  pointer: string,
  type: ManagedFieldDescriptor["type"],
): ManagedFieldDescriptor {
  const field = only(
    pageFields.filter((candidate) => hasResolver(candidate, HOME_PATH, pointer)),
    `rendered field at ${pointer}`,
  );
  if (field.type !== type) return fail(`Field at ${pointer} must be ${type}`);
  return field;
}

function protectedField(
  path: string,
  pointer: string,
  valueType: ManagedInternalValueType,
): ManagedInternalProtectedField {
  const field = only(
    managedSite.contract.internalSeo.protectedFields.filter((candidate) =>
      hasResolver(candidate, path, pointer),
    ),
    `protected field at ${path}#${pointer}`,
  );
  if (field.valueType !== valueType) {
    return fail(`Protected field at ${pointer} must be ${valueType}`);
  }
  return field;
}

function text(pointer: string, type: RenderedTextType) {
  const field = renderedField(pointer, type);
  const content = managedSite.readValue({
    fieldId: field.id,
    owner: pageOwner,
    type,
  });
  return Object.freeze({ fieldId: field.id, value: content.value });
}

function image(pointer: string) {
  const field = renderedField(pointer, "image");
  const content = managedSite.readValue({
    fieldId: field.id,
    owner: pageOwner,
    type: "image",
  });
  if (!content.value.path.startsWith("public/") || content.value.altText === null) {
    return fail("Managed hero image must be public and informative");
  }
  return Object.freeze({
    fieldId: field.id,
    src: `/${content.value.path.slice("public/".length)}`,
    alt: content.value.altText,
    width: content.value.width,
    height: content.value.height,
  });
}

function collectionAt(pointer: string): ManagedCollectionDescriptor {
  return only(
    managedSite.contract.collections.filter(
      (collection) =>
        collection.resolver.path === HOME_PATH &&
        collection.resolver.pointer === pointer,
    ),
    `collection at ${pointer}`,
  );
}

function itemField(
  collection: ManagedCollectionDescriptor,
  pointer: string,
  type: ManagedCollectionItemField["type"],
): ManagedCollectionItemField {
  const field = only(
    collection.itemFields.filter((candidate) => candidate.itemPointer === pointer),
    `FAQ item field at ${pointer}`,
  );
  if (field.type !== type) return fail(`FAQ item field at ${pointer} must be ${type}`);
  return field;
}

function faqItem(
  collection: ManagedCollectionDescriptor,
  questionField: ManagedCollectionItemField,
  answerField: ManagedCollectionItemField,
  itemId: StableId<"item">,
) {
  const owner: ManagedContentOwner = {
    kind: "collection_item",
    collectionId: collection.id,
    itemId,
  };
  const question = managedSite.readValue({
    fieldId: questionField.id,
    owner,
    type: "plain_text",
  });
  const answer = managedSite.readValue({
    fieldId: answerField.id,
    owner,
    type: "plain_text",
  });
  // Each cell carries its field id beside its value, exactly as a page-owned
  // value does, so the template can name the cell it renders. A cell is named by
  // its field AND its item: the collection declares the field once and renders
  // it once per item, so the field id alone names a column.
  return Object.freeze({
    itemId,
    question: Object.freeze({ fieldId: questionField.id, value: question.value }),
    answer: Object.freeze({ fieldId: answerField.id, value: answer.value }),
  });
}

function faqItems() {
  const collection = collectionAt("/faq/items");
  const orderField = renderedField("/faq/order", "collection");
  const order = managedSite.readValue({
    fieldId: orderField.id,
    owner: pageOwner,
    type: "collection",
  });
  const questionField = itemField(collection, "/question", "plain_text");
  const answerField = itemField(collection, "/answer", "plain_text");
  const items = order.value.orderedItemIds.map((itemId) =>
    faqItem(collection, questionField, answerField, itemId),
  );
  return Object.freeze({ fieldId: orderField.id, items: Object.freeze(items) });
}

function cardItem(
  collection: ManagedCollectionDescriptor,
  titleField: ManagedCollectionItemField,
  descriptionField: ManagedCollectionItemField,
  itemId: StableId<"item">,
) {
  const owner: ManagedContentOwner = {
    kind: "collection_item",
    collectionId: collection.id,
    itemId,
  };
  const title = managedSite.readValue({
    fieldId: titleField.id,
    owner,
    type: "plain_text",
  });
  const description = managedSite.readValue({
    fieldId: descriptionField.id,
    owner,
    type: "plain_text",
  });
  return Object.freeze({
    itemId,
    title: Object.freeze({ fieldId: titleField.id, value: title.value }),
    description: Object.freeze({
      fieldId: descriptionField.id,
      value: description.value,
    }),
  });
}

function cardItems(pointer: string) {
  const collection = collectionAt(`${pointer}/items`);
  const orderField = renderedField(`${pointer}/order`, "collection");
  const order = managedSite.readValue({
    fieldId: orderField.id,
    owner: pageOwner,
    type: "collection",
  });
  const titleField = itemField(collection, "/title", "plain_text");
  const descriptionField = itemField(collection, "/description", "plain_text");
  const items = order.value.orderedItemIds.map((itemId) =>
    cardItem(collection, titleField, descriptionField, itemId),
  );
  return Object.freeze({ fieldId: orderField.id, items: Object.freeze(items) });
}

function internalValue<Type extends ManagedInternalValueType>(
  path: string,
  pointer: string,
  valueType: Type,
): InternalValueByType<Type> {
  const field = protectedField(path, pointer, valueType);
  const value = managedSite.readValue({
    fieldId: field.id,
    owner: field.scope === "site" ? siteOwner : pageOwner,
    type: "internal_protected",
  });
  if (value.valueType !== valueType) {
    return fail(`Protected content at ${pointer} must be ${valueType}`);
  }
  return value as InternalValueByType<Type>;
}

const faq = faqItems();
const values = cardItems("/values");
const services = cardItems("/services");
const focus = cardItems("/focus");
const process = cardItems("/process");
const metadataIndexing = internalValue(
  HOME_PATH,
  "/seo/indexing",
  "indexing_directives",
).value;

export const managedHome = Object.freeze({
  pageId: page.id,
  hero: Object.freeze({
    eyebrow: text("/hero/eyebrow", "plain_text"),
    title: text("/hero/title", "heading_text"),
    description: text("/hero/description", "plain_text"),
    image: image("/hero/image"),
  }),
  values: Object.freeze({
    heading: text("/values/heading", "heading_text"),
    description: text("/values/description", "plain_text"),
    fieldId: values.fieldId,
    items: values.items,
  }),
  services: Object.freeze({
    heading: text("/services/heading", "heading_text"),
    description: text("/services/description", "plain_text"),
    fieldId: services.fieldId,
    items: services.items,
  }),
  focus: Object.freeze({
    eyebrow: text("/focus/eyebrow", "plain_text"),
    heading: text("/focus/heading", "heading_text"),
    description: text("/focus/description", "plain_text"),
    fieldId: focus.fieldId,
    items: focus.items,
  }),
  process: Object.freeze({
    heading: text("/process/heading", "heading_text"),
    description: text("/process/description", "plain_text"),
    fieldId: process.fieldId,
    items: process.items,
  }),
  faq: Object.freeze({
    heading: text("/faq/heading", "heading_text"),
    fieldId: faq.fieldId,
    items: faq.items,
  }),
  insights: Object.freeze({
    heading: text("/faq/heading", "heading_text"),
    fieldId: faq.fieldId,
    items: faq.items,
  }),
  contact: Object.freeze({
    eyebrow: text("/contact/eyebrow", "plain_text"),
    heading: text("/contact/heading", "heading_text"),
    description: text("/contact/description", "plain_text"),
  }),
  seo: Object.freeze({
    identity: Object.freeze({
      legalName: internalValue(SITE_PATH, "/identity/legalName", "string").value,
      displayName: internalValue(SITE_PATH, "/identity/displayName", "string").value,
      description: internalValue(SITE_PATH, "/identity/description", "string").value,
      telephone: internalValue(SITE_PATH, "/identity/telephone", "string").value,
      postalAddress: internalValue(
        SITE_PATH,
        "/identity/postalAddress",
        "postal_address",
      ).value,
      email: internalValue(SITE_PATH, "/identity/email", "string").value,
      sameAs: internalValue(SITE_PATH, "/identity/sameAs", "string_list").value,
    }),
    metadata: Object.freeze({
      title: internalValue(HOME_PATH, "/seo/title", "string").value,
      description: internalValue(HOME_PATH, "/seo/description", "string").value,
      canonical: internalValue(HOME_PATH, "/seo/canonical", "url").value,
      indexing: metadataIndexing,
    }),
  }),
});
