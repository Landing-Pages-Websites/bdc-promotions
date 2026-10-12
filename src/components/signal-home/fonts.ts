import { Barlow_Condensed, Barlow_Semi_Condensed, Instrument_Sans, Saira } from "next/font/google";

// Chosen by side-by-side glyph/width fits against image 1 (see workflow/homepage/notes/A-build.md).
// Saira's wdth axis (50–125) covers every condensed display role with one family.
export const saira = Saira({ subsets: ["latin"], axes: ["wdth"], variable: "--a-display", display: "swap" });
export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--a-label",
  display: "swap",
});
export const barlowSemiCondensed = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--a-semi",
  display: "swap",
});
export const instrumentSans = Instrument_Sans({ subsets: ["latin"], axes: ["wdth"], variable: "--a-body", display: "swap" });

export const fontVariables = [saira, barlowCondensed, barlowSemiCondensed, instrumentSans].map((font) => font.variable).join(" ");
