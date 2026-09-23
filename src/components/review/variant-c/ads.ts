import { serviceOptions } from "../content";

/* Supplied creative, copied byte-identical into public/images/design/variant-c/
   (sha256 recorded in workflow/homepage/C-BRIEF.md §7).
   `headline` is the ad's own printed headline (its Work caption); `spec` is a format fact read off the
   file or the ad itself. Neither restates an ad's offer or financing terms: "$0 down" and payment
   figures are Truth-in-Lending trigger terms that need disclosures (C-BRIEF §13). Never a dealer name. */
const dir = "/images/design/variant-c";

export type Ad = {
  src: string;
  width: number;
  height: number;
  alt: string;
  headline: string;
  spec: string;
};

export const ads = {
  luxury: {
    src: `${dir}/ad-luxury-campaign.png`,
    width: 1122,
    height: 1402,
    alt: "Luxury campaign ad headlined “We Make Luxury Affordable”: three luxury vehicles outside a palm-lined showroom at sunset",
    headline: "“We Make Luxury Affordable”",
    spec: "4:5 portrait",
  },
  usedCar: {
    src: `${dir}/ad-used-car-event.png`,
    width: 1086,
    height: 1448,
    alt: "Red event ad headlined “Massive Used Car Sales Event” over a row of four vehicles",
    headline: "“Massive Used Car Sales Event”",
    spec: "3:4 portrait",
  },
  wholesale: {
    src: `${dir}/ad-wholesale-public.png`,
    width: 1122,
    height: 1402,
    alt: "Promotional ad headlined “Wholesale to the Public” over sports cars and SUVs outside a showroom at sunset",
    headline: "“Wholesale to the Public”",
    spec: "4:5 portrait",
  },
  repo: {
    src: `${dir}/ad-repo-sale.png`,
    width: 1080,
    height: 1080,
    alt: "Square event ad headlined “Massive Repo Sale” with three vehicles framed by caution tape",
    headline: "“Massive Repo Sale”",
    spec: "1:1 square",
  },
  storyboard: {
    src: `${dir}/ad-luxury-storyboard.png`,
    width: 426,
    height: 640,
    alt: "Storyboard for a 30-second luxury TV spot: five scenes, each a still frame beside its visual and voice-over direction",
    headline: "“30-second luxury TV storyboard”",
    spec: "Five scenes · visual and voice-over direction",
  },
  inventory: {
    src: `${dir}/ad-meta-inventory.png`,
    width: 1090,
    height: 596,
    alt: "Meta carousel ad on a phone asking “Still in the market for a pre-owned truck?” with three pickup trucks to swipe through",
    headline: "“Still in the market for a pre-owned truck?”",
    spec: "Meta carousel · three vehicle cards",
  },
  vla: {
    src: `${dir}/ad-google-vla.png`,
    width: 963,
    height: 509,
    alt: "Google search result with a sponsored row of new pickup-truck listings, each card showing a photo, model year and price",
    // ponytail: a search-result screenshot has no headline of its own; its ad type is the caption.
    headline: "Google Vehicle Listing Ads",
    spec: "Sponsored search row · one card per vehicle",
  },
} as const satisfies Record<string, Ad>;

export type AdKey = keyof typeof ads;
export type ServiceIndex = 0 | 1 | 2 | 3;
export const serviceIndexes: readonly ServiceIndex[] = [0, 1, 2, 3];

/** "$2,500 / month" → ["$2,500", "/ month"], so the amount and its unit can be set at different sizes. */
export function splitPrice(index: ServiceIndex): readonly [string, string] {
  const price = serviceOptions[index][1];
  const cut = price.indexOf(" / ");
  return cut < 0 ? [price, ""] : [price.slice(0, cut), price.slice(cut + 1)];
}
