# Round 3 (final) — critic:C

## Verdict: PASS

This is a pass with fixes to make before freezing. No AI tell appears, no REJECTED verdict repeats, and every dimension scores 8 or above.

The most damaging problem left is in the thesis section. The Work intro says "Inspect the range: new-car lead generation, event advertising, testimonial videos, employee stories, luxury films, viral concepts, Meta inventory ads, and Google Vehicle Listing Ads" (`Work.tsx:65`). The section then shows no testimonial video, no employee story and no viral concept. On a section labelled "The work is the proof", a GM told to "inspect" three things that aren't there reads it as a broken promise. The FAQ's first answer repeats the same eight-item list 3,500px lower.

## AI-tell flags: 0

## Round-2 findings: status
| R2 finding | Status (verified on r3 captures and in source) |
|---|---|
| Mask faded captions below AA at 1440/1536/320 (CORRECTNESS) | **Resolved.** The mask is on `.stack` only and the stack holds no text (`fold.module.css:88–97`). "LUXURY CAMPAIGN" sits whole above the fold edge at 1280 (y≈680/800), 1440 (y≈783/900) and 1536 (y≈830/864). The stack is hidden at ≤760. |
| Meta and storyboard shown as fragments in the wall | **Resolved.** Both are out of the wall at every width and shown whole in Work. |
| V167 "Customer-supplied automotive creative" label, alts, aria | **Resolved.** The label is gone. A grep finds "supplied" only in code comments, and the alts describe the ads. |
| V85 question-headline close and duplicate caps line | **Resolved.** The H2 is now "Start with a free audit. No obligation." and the caps line is deleted. |
| FAQ in a white card | **Resolved.** It is now ruled rows on graphite. |
| Proof list wrapping 2+1 | **Resolved** (deleted). |
| Call link wrapping under the pill at 1280/1440 | **Resolved.** It sits on its own line at every width. |
| Path dead space; Path→Close rhythm | **Resolved.** Bottom padding is 48; gaps are 144/192/192/144. |
| Work repeats the fold's four posters straight after it | **Resolved.** Order is storyboard \| Meta → VLA → posters at 2–3×. The luxury lead is not repeated. |
| VLA upscaled 135% | **Resolved.** It is capped at native 963 with the caption in the freed column. |
| Ledger "Term" column and its Luxury Video cell | **Resolved.** The column is "Terms" and the cell reads "1 new video each month". |
| 320 bar splits the number; bar sits on the pill | **Resolved.** The number is nowrap and shown alone below 360. At ≤800 tall the pill comes before the strip. |
| 390 eyebrow break; straight apostrophe; mobile two-up rows; storyboard width | **Resolved.** The eyebrow breaks after the slash, "we’ll" is curly, the used-car and wholesale row justifies to one height, and the storyboard and repo run full width. |
| Fold image area floor | **Met as amended.** `styles.json` geometry reads 36% at 1440 (floor 34) and the brief measures 39% at 1536. The lead piece is 28.7% of the 1440 viewport against A's ≈29%. |
| MYNDSET MEDIA mark on the storyboard | **Open, owner question.** It is legible in Work at 1536 (desktop-02) and at 390 (mobile-02). This is not a design fail: the asset is in the client's own supplied references, and A and B show it too. It must be confirmed before production. |

## Scores
| Dimension | Score | Evidence (what I see in the screenshot) | Fix |
|---|---|---|---|
| Typography | 8/10 | Archivo only: 140 nodes; the 5 Manrope nodes are the shared consent banner. H1 is wdth125/800 at 72.6px (1440) and 76px (1536); type ratio 6.1. C uses 7 of its own sizes; the auto-flag's 9 includes the banner's 14 and the skip link's 16. Prices are tabular and nowrap, and captions use real quotes. Defects: (1) 5 sizes in the 1440 fold (72.6/24/20/17/12) against the ≤4 rule. (2) At 390 and 320 the pill wraps to two lines, "Get a free dealership / marketing audit →", which makes a 57px two-line pill. (3) At 390 the Path eyebrow orphans its arrow: "…NURTURE / → APPOINTMENT". | (2) At ≤480, label the fold, ledger and close pills "Get a free marketing audit →" (≈245px, fits the 298px inner width). (3) Delete that eyebrow (see Restraint). |
| Spacing & rhythm | 8/10 | Gaps are 144/192/192/144, grounds alternate, and Path→Close is a 48px pair. Work groups sit at a consistent ~64px under 1px rules, and the event row justifies to one height. The weak spots: (1) The H1 ink sits only 35–38px from the lead ad at 1280/1440/1536. It is the tightest structural gap on the page, next to its busiest object; Superside keeps ≈160px of ground there. (2) The footer uses `repeat(3,1fr)` (`proof-wall.module.css:278`), so its dividers at x≈553/985 (1536) ignore the 7fr/5fr split every section above uses (x≈906). (3) The VLA's freed column leaves ≈333×450px of blank concrete above a bottom-aligned caption. | (1) Optional: take `.wall` left to `copy + 48px`. Clearance becomes ≈64 at a cost of ~3 points of lead share, so skip it if the rank judge prefers the bigger lead. (2) Footer `grid-template-columns: 7fr 5fr`: wordmark in the first cell, phone and email sharing the second. |
| Color & contrast | 9/10 | Concrete `#EFEBE3`, graphite, and one red `#C8231B` used only for act (pill, call underline, bar cell). Steel on concrete is ≈5.9:1, steel on white 6.06:1, fog on graphite passes, and white on red is ≈5.6:1. 0 gradients (the mask is functional), 0 shadows of C's own; the single `shadow-lg` is outside C's CSS. No text inside any masked element. | — |
| Layout & hierarchy | 8/10 | Spine: fold loud → Work medium → Pricing loud (graphite) → Path quiet → Close medium. There is one primary, and the fold owns the viewport (V187). The lead piece is level with the H1, and the sticker is the ownable device, reused as the ledger header (V199). Weakest band: Path's five equal columns with a node line. It is the page's one stock "how it works" stepper; it is left-aligned and has no circles, so it is not V71, but it is generic. At 1280 the third stack tile shows only a ≈50px ghost of "WHOLESALE". | Keep the stepper at desktop. Use the mobile layout, numbered ruled rows on a 48px/1fr grid, from 1199 down (it already exists at ≤760). |
| Specificity | 9/10 | Seven real ads, four real prices, one non-guarantee, and domain nouns (BDC, VLA, Meta carousel, 3-month commitment). The logo-swap test fails for any other agency: the prices and the dealer creative are this company's. | Resolve the Myndset credit with the owner before production. |
| Copy | 8/10 | The H1 is verb-first and about the reader. The close is a statement taken from the verified /lp offer. Captions quote each ad's own headline. Defects: (1) "Inspect the range" lists three categories the page never shows (lead finding). (2) FAQ "What kinds of creative…" repeats that list, and "What happens after a lead comes in?" restates Path step 04. (3) "Share your details on the form": this page has no form. (4) The alt at `ads.ts:32` says "over a row of five cars"; the ad shows four vehicles (verified on the source file). | (1) Rewrite as: "Seven pieces below: luxury, event and promotional statics, a TV storyboard, a Meta carousel and Google VLAs. The range also covers testimonial videos, employee stories and viral concepts." (2) Drop the "kinds of creative" FAQ item in C. (3) "Request the free audit or call, and we’ll confirm fit for your market." (4) "…over a row of four vehicles". |
| Restraint | 8/10 | 0 animation, 0 gradients, 0 own shadows, 0 icons, 0 badges, one accent. Three small removables remain: (a) the format lines "3:4 PORTRAIT / 4:5 PORTRAIT / 1:1 SQUARE" (`ads.ts:26–50`) state file geometry the eye already sees, and 3:4 is not even a placement; (b) the Path eyebrow "STRATEGY → … → APPOINTMENT" repeats the five step titles 60px below it; (c) the duplicate FAQ item. | Delete (a) for the three posters and keep the informative spec lines (storyboard, Meta, VLA). Delete (b). Delete (c). |
| Mobile | 8/10 | At 390 the fold runs eyebrow → 4-line H1 → luxury ad plus sticker with all four prices → pill, with the phone in the header and a 64px bar. No overflow at 320 or 390. The ledger transposes with inline TERMS/INCLUDES labels (V176), and the two-up rows justify. The fold height is content-driven at ≤1199 (`min-height: 0`), so nothing is clipped. Defects: (1) the two-line pill; (2) the sticker's service names and the non-guarantee line are 12px (`fold.module.css:249–251`); the ledger restates them at 17px; (3) at 320×700 the bar covers the sticker's non-guarantee line on first paint. (4) No capture exists between 761 and 1199, so the tablet path (`.wall { height: 720px }`, `fold.module.css:169–175`) is unverified. | (1) Shorter label as above. (2) Sticker names 14px at ≤760; the 22px prices still fit at 390, so check "$5,000 / month" at 375. (4) Capture 1024×768 and 834×1112 before freezing. |
| 4s/40s test | 9/10 | 4s at 1440: dealer ad agency (H1 plus luxury ad), four prices, "Get a free dealership marketing audit". The eye goes lead ad → sticker → H1 → red pill. 40s: work (whole, captioned) → ledger ending on the non-guarantee → five-step path → audit offer with steps → open FAQ. It is an argument, not a feature list. The only snag is the "Inspect the range" mismatch. | Copy fix (1). |
| Brief adherence | 8/10 | Matches C-BRIEF §12–§13 on every measured line: lead share 26.1/28.7/32.0%, type ratio 6.1/6.3, 7 sizes, 0/0/0 effects, mask on image-only stack, and the 390 and 320 fold orders. **DESIGN.md's C section is stale** against the page it describes: it still lists IBM Plex Mono, the pillar strip, Standards, the showroom photo, concrete `#ECECE8`, "the fold shows 7 pieces" and "each ad appears whole below the fold". §13 removed the luxury repeat, so the luxury ad now appears whole only in the fold. | Sync DESIGN.md §"Variant C" to §12–§13 before anything is frozen into `approved/`. It is a documentation change, not a design change. |

## Top 3 changes, in order of impact
1. **Make Work deliver what it announces.** Replace "Inspect the range: …" (`Work.tsx:65`) with the line in the Copy row, which names the seven pieces shown and then the categories not shown. In C, drop the FAQ item that repeats the list. Fix the `ads.ts:32` alt to "four vehicles", and fix "on the form" in the states answer.
2. **Cut the three redundant 12px lines and the stock stepper feel.** Delete the three aspect-ratio spec lines (`ads.ts:26–50`, posters only) and the Path eyebrow (`Path.tsx:15`). Use the mobile ruled-row Path layout from ≤1199 up, or at least on tablet. Align the footer to the 7fr/5fr grid.
3. **Finish the phone and the paperwork.**
   - At ≤480, shorten the pill label to "Get a free marketing audit →" so it is one line.
   - Set the sticker service names to 14px at ≤760.
   - Capture 1024 and 834 to verify the untested tablet wall.
   - Sync DESIGN.md's C section to C-BRIEF §12–§13.
   - Get the owner's ruling on the MYNDSET MEDIA credit.

## What is already good (keep)
- **The fold does the job at every width.** One lead ad sized to the frame: 545×681 at 1440, 28.7% of the viewport, matching A's plate. It sits level with a 72.6px wdth125/800 H1. One portrait window sticker shows all four prices plus the non-guarantee above y≈440. The single primary is a red pill with an "or call" text link on its own line. The fold owns the viewport (V187), and the H1 ink clears the wall at 1280, 1440 and 1536 (V202).
- **The window sticker is the ownable device (V199).** The same graphite band, ruled rows and wide-800 tabular prices appear in the fold sticker and the ledger header. No reference fold in the frozen set of 10 shows a price.
- **The pricing ledger:** service, price, terms and includes in one table. Its footer states "Are results guaranteed? No…" at 17px (V186 negation, SR9), and it transposes at 390 with the label mapping intact (V176).
- **Work shows every piece whole and captioned with its own printed headline.** The VLA is capped at native width. The posters row justifies to one height, and the phone two-up rows do the same.
- **System discipline:** one family, 7 sizes, red means only "act", 0 animation, 0 gradients, 0 own shadows, 0 icons. Grounds alternate concrete/graphite with a 48px Path→Close pair.
- **No trace of V165, V167 or V85 anywhere.** The close is a statement plus three verbatim audit steps and an open FAQ on rules.

## Corpus comparison
- **Superside (reproduced reference):**
  - C keeps its geometry: statement left, work wall right, one CTA.
  - C beats it on information: four prices and a non-guarantee in the fold.
  - C falls short on ease. Superside's wall bleeds under the nav and keeps ≈160px of ground between headline and wall. C's wall starts 16px under the header, its H1 sits 35–38px from the lead, and the sticker's 2px border is 12px from the window edge. C's fold is denser and more informative, and less relaxed.
- **MVSM:** a neutral light ground with all the saturation carried by the work. C's concrete-plus-borrowed-colour register is the same move, which validates C's neutral chrome against the round-2 "all its saturation comes from the ads" note.
- **Billion Dollar Boy:** type ratio 10.7 on a brand-owned colour field. C runs 6.1 with no brand field. That is quieter, but acceptable now that one lead piece is the focal point.

## C vs A vs B (r3, 1440)
- **C beats B outright.** B shows one piece and no price in the fold and uses two boxed CTAs. It still prints "Source plate / customer-supplied automotive creative" (V167) and "No unverified dealership count…" (V165), and its nav says "DEALERSHIP GROWTH EDITORS". Its first price is at y≈4,000.
- **C beats A as a page.**
  - Lead pieces are now equal (28.7% vs ≈29%).
  - C has four prices at y≈140–440; A's first is at y≈3,790.
  - C has one primary; A has two boxed CTAs.
  - A still runs a Standards panel ("Never imply guaranteed…") as content.
  - A's navy field with neon-cyan route lines and a tilted plate carries Look-2 tells that C does not.
- **A still has more brand-owned energy in its fold.** Its electric-blue slab is A's own colour, while C's colour comes from the ads.
- **Net:** C is the strongest of the three and the one to show a GM who is comparing agencies. The Top 3 above are polish, not blockers.

Files:
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/Work.tsx` (line 65: "Inspect the range")
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/ads.ts` (line 32: "five cars" alt; lines 26–50: aspect-ratio spec lines)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/Path.tsx` (line 15: redundant eyebrow)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/Close.tsx` (lines 18–21: FAQ list)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/proof-wall.module.css` (line 278: footer grid)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/fold.module.css` (lines 169–175: untested tablet wall; lines 249–256: mobile sticker sizes)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/DESIGN.md` (stale "Variant C" section)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/public/images/design/variant-c/ad-luxury-storyboard.png` (MYNDSET MEDIA mark, owner question)
- `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r3-c/styles.json` (fold image area 36, type ratio 6.1, 0 animations/gradients)