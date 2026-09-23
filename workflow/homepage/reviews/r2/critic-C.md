# Round 2 — critic:C

## Verdict: FAIL

This is a narrow fail. Every round-1 finding is fixed except the image floor, and C is now the strongest of the three pages. Two defects block the pass.

The most damaging one is at the bottom edge of the fold, which every desktop visitor sees. The wall's 96px mask (`fold.module.css:120–121`) is applied to whole `.column`s, so it fades captions as well as pictures:
- At 1440, "META INVENTORY AD" (y≈884) and "LUXURY VIDEO STORYBOARD" (y≈860–876) render as grey ghosts.
- At 1536, "LUXURY VIDEO" (y≈858) is close to invisible.
- At 320, "INVENTORY AD" fades.

That is text below AA, which is CORRECTNESS and never dismissible. The same edge also turns two of the six wall pieces into fragments. At 1536 the Meta ad shows only about 140px: a phone bezel on blue. At 390 it is a 70px sliver under the luxury ad that looks like a broken image. The storyboard is a 426px-wide document shown at 156px, so it reads as dark noise.

The second defect is the Work intro's "Customer-supplied automotive creative" label. A dealership GM reads it as "our customers made these ads", which reverses the page's thesis.

## AI-tell flags: 2
- **Rejected verdict V167 (build vocabulary used as interface copy).** Its predicate `sells=media AND buyer=comparing` matches this project, whose axes are sells=expertise+media and buyer=comparing.
  - **Where:** the label "CUSTOMER-SUPPLIED AUTOMOTIVE CREATIVE" (1536 slice desktop-02, y≈198; `Work.tsx:62`). The same wording opens all 7 alt strings in `ads.ts` ("Customer-supplied luxury campaign ad…") and the wall's two `aria-label`s (`Fold.tsx:63, 73`). "Customer-supplied" is how the asset manifest describes provenance to the build team; on the page it tells a buyer the work came from dealers.
  - **Fix:** delete the label. Rewrite each alt to describe the ad only, for example "Luxury campaign ad: 'We Make Luxury Affordable', $1,000 savings voucher". No dealer names, per the brief's exclusions. Change the aria-labels to "Automotive ad creative". Do not replace the label with an authorship claim.
- **Big CTA band before the footer / lorem-like copy (partial repeat of V85, REJECTED · AESTHETIC).**
  - **Where:** the graphite close band. Its H2 is "Ready to create more opportunities for your dealership?" at 52px: 3 lines at 1536, 4 at 390. The numbered audit lines under it are V85's own approved replacement and are correct. Only the question headline is the template.
  - **Fix:**
    - Replace the H2 with a statement taken from the verified /lp offer: "Start with a free audit. No obligation." Then delete the 12px caps line "Free dealership marketing audit and consultation, no obligation", which carries the same fact.
    - Take the FAQ out of its white card and set it as 1px-ruled rows on graphite. Keep the white panel for the sticker and the ledger only; per SR2, cards are for discrete objects.

## Scores
| Dimension | Score | Evidence (what I see in the screenshot) | Fix |
|---|---|---|---|
| Typography | 8/10 | Archivo only: styles.json counts 142 Archivo nodes, and the 5 Manrope nodes are the shared banner from `src/app/layout.tsx`. The wdth-125/800 H1 is 72.6px at 1440, a type ratio of 6.1. 7 sizes, sentence case, curly quotes on captions. Small defects: (1) the fold proof list wraps two items then one ("■ REAL AUTOMOTIVE CREATIVE. ■ REAL FOLLOW-UP." / "■ A CLEARER PATH…") at 1280, 1440 and 1536, a `flex-wrap` artifact (`fold.module.css:37–40`). (2) 5 sizes in the 1440 fold (72.6/24/20/17/12). (3) At 390 the eyebrow breaks as "CREATIVE TO / APPOINTMENT". (4) A straight apostrophe in "we'll" (`Close.tsx:21`). | Set `.proofList { flex-direction: column }`, or delete the list, since the wall already says "real creative". At ≤480, break the eyebrow after the slash. Use ’. |
| Spacing & rhythm | 7/10 | One 96px padding token everywhere (gaps 144/192/192/192). Alternating grounds do the separating, but every band breathes the same. The Path band ends on "Set the visit. Win the appointment." with about 100px of dead concrete under it (desktop-06). The "or call" link sits inline at 1536 but drops under the pill at 1280 and 1440, because the 527px copy column can't hold 357 + 24 + 170. That reads as an accident. Mobile Work two-up rows are not justified: row-1 captions sit 25px apart, and Repo leaves about 70px of empty space under it (mobile-02). | Pull Close up to Path: 48px after a 192px gap, so process and offer read as one move. Give the call link `flex-basis: 100%` at every desktop width so its position is a choice. Justify the mobile two-up rows by aspect ratio (`flex-grow` = w/h), as desktop already does. |
| Color & contrast | 7/10 | Warm concrete `#EFEBE3`, graphite, and one red that now only means "act". Steel is 6.06:1. It fails because the mask fades captions below AA at 1440, 1536 and 320 (see the verdict). | Never mask text. Remove the figcaption from the last tile in each wall column (Meta, storyboard, repo); Work labels all three. Then no caption can enter the fade at any width. Check caption contrast at 1280, 1440, 1536 and 320. |
| Layout & hierarchy | 7/10 | The round-1 complaint "14 equal objects" is answered. The luxury ad (413×516 at 1440) is a real lead piece level with the H1, the sticker owns the top right, and there is one primary. Three problems remain: (a) two of six wall pieces are fragments; (b) fold image area is 34% at 1440 and 36% at 1536, against the brief's 37% floor; (c) Work row 1, straight after the fold, repeats the same four event posters at 292–365px. Seven pieces shown twice in the first 2,000px advertises how few there are. | (a) Crop the wall's Meta tile to its carousel with `aspect-ratio: 413/170; object-fit: cover; object-position: 50% 80%`, so the surviving strip shows three trucks with prices, not the phone's top bezel. The whole ad stays in Work. (b) Re-measure image area; meet §3's floor or amend it with the reason. (c) See Top 3 #3. |
| Specificity | 8/10 | Seven real ads, four real prices, domain nouns (BDC, VLA, Meta inventory, 3-month commitment). The window-sticker device appears twice, in the fold and the ledger. Two issues: the "Customer-supplied" label (flag), and the storyboard prints "MYNDSET MEDIA" in its header and footer. That mark is readable in Work at 1536 (desktop-02/03). It is another company's mark on work presented as BDC's. | Confirm with the owner whether Myndset Media is BDC's production name or a partner who allows the credit. If neither, crop below the header band or drop the piece; it is unreadable at every size anyway, because the source is 426×640. This also affects A and B. |
| Copy | 7/10 | The H1 is verb-first and about the reader. Captions quote each ad's printed headline. "Start with one service. Connect the full lane." is good. Defects: the two flags above. Also, the ledger's "Term" column holds "Includes 1 new video each month" for Luxury Video, so the 390 layout reads "TERM / Includes 1 new video each month" followed by "INCLUDES / Premium automotive video creative" (mobile-04). | Rename the column "Terms" and change that cell to "1 new video each month". The audit steps are verbatim from /lp, so keep them. |
| Restraint | 8/10 | 0 animation, 0 gradients beyond the functional mask, 0 shadows of C's own, one accent. The pillar strip, Standards, showroom, mono and duplicate FAQ items are gone. The page is 7,154 → 5,989px at 1440 and 12,415 → 8,350px at 390. Still removable: the "Customer-supplied" label, the proof list (it restates the lead, and the wall proves it), and the FAQ's card chrome. | Delete those three. |
| Mobile | 7/10 | The 390 fold now runs H1 → luxury ad → sticker with all four prices and "/ month" → CTA, so the thesis is on the first screen. There is no overflow, and the ledger keeps its label mapping (V176). Defects: (1) at 320 the fixed bar splits the phone number as "Call (352) 207-" / "1074" (`Chrome.tsx:50`, no nowrap). (2) At 320×700 the bar sits on the fold pill, whose red top arc peeks above it. (3) At 390 the strip ends on the 70px Meta sliver. (4) The storyboard runs half-width at about 140px, with its caption floating at the bottom of an empty right cell. (5) The transposed ledger is about 1,150px for four rows. | (1) Wrap the number in `.nowrap`, and below 360px show only "(352) 207-1074" in the call cell. (3) Drop Meta from the ≤760 strip, leaving the luxury ad and its caption on the left and the sticker on the right. (4) Run the storyboard full width on mobile. (5) At ≤760, put name and price on one line, with "3-month commitment · includes…" as one 15px line under it. |
| 4s/40s test | 8/10 | 4s at 1440: automotive ad agency, a luxury dealer ad, four prices, get an audit. The eye goes luxury ad → sticker → H1 → red pill in about 3s. 40s: work → prices ending on the non-guarantee → five-step path → audit offer and FAQ, which is a real argument. The 40s scan loses a point because it meets the same four posters twice. | Top 3 #3. |
| Brief adherence | 7/10 | Met from §12: one family; red means "act"; grounds alternate; V165, pillars, showroom and mono deleted; one sticker object reused in the ledger; one primary plus a text link; all prices above y=864 (the sticker ends at y≈347 at 1536); the 390 fold order; nowrap prices; "AI-supported" kept whole; type ratio 6.1 (1440) and 6.3 (1536). Missed: the image floor (34/36 vs 37). §12 says the call link is inline, but it is only inline at 1536. The fade now crops captions, a case §12 didn't anticipate. | Apply the Layout and Color fixes, then re-measure at 1280, 1440 and 1536 with `screenshot.mjs`. |

## Top 3 changes, in order of impact
1. **Fix the fold's bottom edge, which is the AA blocker.**
   - Render no caption on the last tile of each wall column (Meta, storyboard, repo).
   - In the wall, crop the Meta ad to its carousel strip (`object-position: 50% 80%`) so it reads as three trucks with prices, not a bezel.
   - Remove Meta from the ≤760 strip.
   - Re-measure caption contrast and fold image area at 1280, 1440, 1536, 390 and 320. Meet the 37% floor or amend C-BRIEF §3 with the reason.
2. **Remove the build vocabulary and the template close.**
   - Delete "Customer-supplied automotive creative". Rewrite the 7 alts and 2 aria-labels to describe the ads.
   - Replace "Ready to create more opportunities for your dealership?" with "Start with a free audit. No obligation." and delete the duplicate caps line.
   - Set the FAQ as ruled rows on graphite, not in a white card.
   - Rename the ledger's "Term" column to "Terms" and change the Luxury Video cell to "1 new video each month".
3. **Make Work earn its repeat, and fix the phone defects.**
   - Give every Work piece a second caption line that copies the offer and CTA printed on it. This adds no claims:
     - Luxury: "$1,000 savings voucher · Message or comment now"
     - Used car: "$2,000 savings voucher · Message or comment 'voucher'"
     - Repo: "$0 down · payments from $99/mo · $2,000 voucher"
     - Meta: "Pre-owned truck carousel · Shop Now on each vehicle"
     - VLA: "Sponsored row: year, price, MSRP, store, town"

     The repeat then becomes a close reading instead of a rerun.
   - Cap the VLA at its native 963px and put its caption in the freed right-hand columns. At 1296px it is upscaled 135% (270% on retina) and visibly soft (desktop-03/04).
   - Add nowrap to the phone number in the 320 bar.
   - Justify the mobile two-up rows, and run the storyboard full width on mobile.

## What is already good (keep)
- **The fold now has one lead piece.** The luxury ad is 413×516 at 1440 and 477×597 at 1536, level with the H1. One window sticker sits top right with all four prices and the non-guarantee, plus one red primary and a text-link call. It owns the 1440×900 viewport (V187), and the H1 ends before the wall at 1280 (V202).
- **The window sticker is C's ownable device (V199), and it appears twice.** Both the fold sticker and the ledger header use a graphite band, ruled rows and wide-800 tabular prices.
- **One family, used with discipline:** Archivo wdth 100/125, 7 sizes, ratio 6.1. Zero animation, zero decorative gradients, zero shadows. Red only means "act".
- **Ground rhythm:** concrete fold and Work → graphite Pricing → concrete Path → graphite Close.
- **The ledger:** service, price, terms and includes in one table, ending on the V186 negation. It transposes at 390 with no horizontal scroll.
- **The 390 fold carries the thesis** (ad plus four prices plus CTA), and the phone page dropped from 12,415 to 8,350px.
- **Work captions quote each ad's own printed headline** in curly quotes, and every piece is shown whole.
- **No V165 line anywhere on the page.**

## Round-1 findings: status
| R1 finding | Status |
|---|---|
| V165 Standards section / "No unverified…" | Resolved (deleted) |
| IBM Plex Mono (66 nodes) | Resolved (Archivo only) |
| Pillar strip | Resolved (deleted) |
| Three concrete sections separated by 224px of padding | Resolved (grounds alternate; gaps 144/192/192/192) |
| AI showroom band | Resolved (deleted) |
| Type ratio ≥6 at 1440 | Resolved (6.1) |
| Title Case buttons, "/ month" split, "AI-/supported" break | Resolved |
| Sticker `flex-grow`, four cards → one sticker object | Resolved |
| Call pill → text link | Resolved, but it wraps under the pill at 1280 and 1440 |
| Work row-3 empty text cell; caption repeated ×4 | Resolved |
| Duplicate FAQ items; ledger CTA naming its destination | Resolved |
| Warm the ground | Resolved (`#EFEBE3`) |
| 390 fold had no work or price; arrow wrap; 12,415px page | Resolved |
| Image area ≥37% | **Not resolved** (34% at 1440, 36% at 1536) |

## C vs A vs B (1440 folds and full pages)
- **C beats B outright.** B's serif trade-journal register is wrong for a dealer-retail buyer. It shows 1 piece and no price in the fold, has two boxed CTAs, and still prints "No unverified dealership count, ad-spend total, client logos, or outcome statistics." (V165) under its signal row. B is locked to its image.
- **C beats A on argument and conversion.**
  - C's fold shows 6 pieces and 4 prices; A's shows 2 pieces and 0 prices, and A's first price is at y≈3,950.
  - C has one primary; A stacks two boxed CTAs.
  - C has no standards section, while A still shows "Proof you can inspect / Never imply guaranteed…" staff rules as content.
  - C shows every ad whole; A uses a collage.
- **A still wins on fold impact and register.** A's luxury plate is about 563×668, or 29% of the frame, on an electric slab. C's lead ad is 413×516, or 16%. A's dark electric chrome reads as "dealer lot at night". C's chrome is correct but neutral, and all its saturation comes from the customers' ads.
- **Net:** C is the best page of the three and the one to show a GM who is comparing agencies. A is still the best fold. With the three fixes above, C should pass; it does not need to out-shout A's fold to be the better page.

## Corpus comparison
- **Superside (the reproduced reference):** statement left, a staggered wall right, one CTA, about 150px of ground below. Its wall bleeds up under the nav, so the work reads as continuing past the frame. Its tiles are unlabelled imagery at one 181px column width.
  - C matches the split and the single CTA, and beats Superside with the price sticker. No fold in the frozen set of 10 shows a price.
  - C falls short in two ways. Its wall is fenced: it starts 16px under the header and ends in a mask that swallows labels. Its side tiles are 156px against Superside's 181px.
- **Billion Dollar Boy:** type ratio 10.7 and a colour field of its own. C runs 6.1 on neutral concrete. That was damaging in round 1, but it is acceptable now that the lead ad gives the fold a focal point.
- **MVSM:** names each piece at about 32px on the image. C's 12px caps labels under the tiles are quieter, which is right when the H1 must stay the loudest object. The labels just can't sit inside the fade.

Files:
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/fold.module.css` (mask at lines 120–121 applies to whole columns; proof list at lines 37–40)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/Work.tsx:62` (the "Customer-supplied" label)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/ads.ts` (the 7 alts)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/Chrome.tsx:50` (bar phone number with no nowrap)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/Ledger.tsx:8` (the "Term" column label)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-c/Close.tsx:21` (straight apostrophe)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/public/images/design/variant-c/ad-google-vla.png` (963×509 source, upscaled to 1296)
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/public/images/design/variant-c/ad-luxury-storyboard.png` (426×640 source, carries the MYNDSET MEDIA mark)
- `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r2-c/styles.json` (image area 34, type ratio 6.1)