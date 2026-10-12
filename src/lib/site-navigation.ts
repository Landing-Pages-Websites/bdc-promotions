// One list for every page header and footer, so Home and the interiors can't drift apart.
export const primaryNavigation = [
  ["/services", "Services"], ["/process", "Process"], ["/work", "Work"],
  ["/about", "About"], ["/blog", "Insights"], ["/contact", "Contact"],
] as const;

export const footerNavigation = [
  ...primaryNavigation,
  ["/pricing", "Service Options"], ["/testimonials", "Testimonials"],
  ["/privacy-policy", "Privacy"], ["/terms", "Terms"], ["/cookie-policy", "Cookies"],
] as const;

export const strategyCall = "https://calendly.com/justins-bdc-promotions/bdc-promotions-strategy-call";
