import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LandingPage, type LandingPageContent } from "./LandingPage";

const card = { title: "Example", description: "Example description" };
const content: LandingPageContent = {
  hero: {
    eyebrow: "Full Service Automotive Marketing",
    title: "We Help Dealerships Generate More Appointments And Sell More Cars.",
    description: "Automotive marketing for dealerships.",
    image: {
      src: "/images/bdc-night-showroom.webp",
      alt: "A modern dealership showroom",
    },
  },
  values: { heading: "Dealer value", description: "Value copy", items: [card] },
  services: {
    heading: "What We Do",
    description: "Services copy",
    items: [card],
  },
  focus: {
    eyebrow: "Built For Dealerships",
    heading: "Focused marketing",
    description: "Focus copy",
    items: [card],
  },
  process: {
    heading: "How It Works",
    description: "Process copy",
    items: [card],
  },
  insights: {
    heading: "Why The Right Conversation Matters",
    items: [{ title: "Speed matters", description: "Insight copy" }],
  },
  contact: {
    eyebrow: "Contact BDC Promotions",
    heading: "Ready to create more appointments?",
    description: "Call our team.",
  },
};

test("renders the complete phone-first landing page", () => {
  const html = renderToStaticMarkup(
    createElement(LandingPage, { content, phone: "352-207-1074" }),
  );

  assert.match(html, /We Help Dealerships Generate More Appointments/);
  assert.match(html, /href="tel:3522071074"/);
  assert.match(html, /id="services"/);
  assert.match(html, /id="process"/);
  assert.match(html, /id="contact"/);
  assert.match(html, /alt="A modern dealership showroom"/);
});
