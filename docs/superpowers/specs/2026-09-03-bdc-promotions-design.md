# BDC Promotions Website Design

## Goal

Rebuild BDC Promotions as a polished, responsive one-page marketing site while preserving the current site's information, section order, business name, and phone-first conversion path. Publish the finished site to a new Vercel production URL in the `mega-websites` team. The existing `bdcpromotions.com` domain remains untouched.

## Visual Direction

The site will use a refined "night-drive automotive" aesthetic: deep navy and near-black surfaces, electric-blue accents, crisp white typography, subtle illuminated gradients, and restrained motion. The page should feel more premium and intentional than the reference while remaining immediately recognizable as the same business.

Relevant automotive and dealership imagery may be introduced where it strengthens the hero or supporting story. Imagery must not overpower the message or turn the page into a generic stock-photo collage.

## Page Structure

The page will retain the reference site's basic flow:

1. Compact header with BDC Promotions branding and a prominent click-to-call action.
2. Hero focused on generating appointments and selling more vehicles.
3. Four dealership value points: fast response, automotive focus, social engagement, and results.
4. Three core services: Messenger lead response, paid social campaigns, and appointment generation.
5. Dealership-focused benefits presented as a clear split layout.
6. Four-step process from learning the store through driving appointments.
7. Educational section explaining why fast, effective conversations matter.
8. Strong closing contact panel and footer with the existing phone number.

All substantive copy from the current site will be preserved, with only minor punctuation or line-break edits for clarity.

## Interaction and Responsiveness

Primary actions will use `tel:3522071074`. The existing "Request Information" action will continue to scroll to the contact section rather than introducing a lead form or new data flow. Navigation, focus states, touch targets, and section anchors will work across desktop and mobile. Motion will respect reduced-motion preferences.

## Technical Approach

The project will be created from the current `Landing-Pages-Websites/site-starter` template and live in `Landing-Pages-Websites/bdc-promotions`. Content will use the starter's managed-site contract and configuration conventions. The implementation will keep the site to one public marketing page plus the starter's required legal, consent, SEO, analytics, and lead-routing plumbing.

Placeholder branding and assets will be replaced. No database, authentication, or external application integration is required for this build.

## Validation and Delivery

Before publication, the project will pass configuration checks, lint, production build, and relevant tests. The page will be browser-verified at desktop and mobile sizes, including the call links and contact anchor. The feature branch will be reviewed through the repository's normal pull-request workflow and deployed to a new Vercel production URL under `mega-websites`.

GitHub command-line authentication is currently unavailable on this machine. Local work may proceed, but creating and pushing the organization repository requires restoring GitHub authentication before final delivery.
