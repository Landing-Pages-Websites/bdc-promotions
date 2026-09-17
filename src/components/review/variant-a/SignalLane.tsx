import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { auditHref, faqItems, growthSteps, phoneDisplay, phoneHref, serviceOptions } from "../content";
import styles from "./signal-lane.module.css";

const A = "/images/design/variant-a";

function SignalHeader(): ReactElement {
  return <header className={styles.header}><Link href="/" aria-label="Return to homepage direction chooser"><Image src="/images/design/shared/bdc-logo-2026.png" alt="BDC Promotions" width={1254} height={749} preload sizes="150px" /></Link><nav aria-label="Signal Lane navigation"><a href="#growth">Process</a><a href="#work">Work</a><a href="#options">Services</a><a href="#contact">Contact</a></nav><a className={styles.headerCall} href={phoneHref}>Call {phoneDisplay}</a></header>;
}

function ShowroomMomentum(): ReactElement {
  return <section className={styles.hero} aria-labelledby="a-hero-title"><div className={styles.routeStart} aria-hidden="true"/><div className={styles.heroCopy}><p className={styles.eyebrow}>Automotive marketing / Creative to appointment</p><h1 id="a-hero-title">Move More Shoppers Toward Your Showroom</h1><p className={styles.lede}>BDC Promotions combines automotive ad creative, campaign optimization, BDC follow-up, and AI-supported nurturing to create more qualified sales opportunities.</p><div className={styles.heroActions}><a className={styles.primary} href={auditHref}>Get a Free Dealership Marketing Audit <span>→</span></a><a className={styles.secondary} href={phoneHref}>Call {phoneDisplay}</a></div><p className={styles.proofLabel}>Real automotive creative. Real follow-up. A clearer path to appointments.</p></div><div className={styles.heroMedia}><figure className={styles.heroBack}><Image src={`${A}/hero-used-car-event.png`} alt="Customer-supplied automotive used-car event campaign creative" width={1086} height={1448} preload sizes="(max-width: 700px) 45vw, 24vw" /></figure><figure className={styles.heroFront}><Image src={`${A}/hero-wholesale-public.png`} alt="Customer-supplied wholesale-to-the-public automotive campaign creative" width={1122} height={1402} preload sizes="(max-width: 700px) 64vw, 31vw" /></figure></div></section>;
}

function OperatingSignal(): ReactElement {
  const labels=["Fast","Focused","Social","Results"];
  const items=["Automotive-specific strategy","Static + video creative","Human + AI-supported follow-up","Scheduled appointment focus"];
  return <section className={styles.signal} aria-labelledby="a-signal-title"><h2 id="a-signal-title">{labels.map((label,index)=><span key={label}>{label}{index<3&&<i aria-hidden="true">/</i>}</span>)}</h2><ol>{items.map((item,index)=><li key={item}><b>{String(index+1).padStart(2,"0")}</b><span>{item}</span></li>)}</ol></section>;
}

function GrowthLane(): ReactElement {
  return <section className={styles.growth} id="growth" aria-labelledby="a-growth-title"><div className={styles.growthIntro}><p className={styles.darkEyebrow}>03 / The Growth Lane</p><h2 id="a-growth-title">One Connected Path From Scroll to Showroom</h2><p>Choose the pieces your dealership needs or connect the full operating lane.</p></div><ol className={styles.steps}>{growthSteps.map(([number,title,copy])=><li key={number}><b>{number}</b><h3>{title}</h3><p>{copy}</p></li>)}</ol><figure className={styles.growthMedia}><Image src={`${A}/growth-repo-sale.png`} alt="Customer-supplied repossession sale campaign example" width={1080} height={1080} sizes="(max-width: 700px) 70vw, 20vw" /><figcaption>Campaign input, offer messaging, and inventory positioning stay connected.</figcaption></figure></section>;
}

function WorkInMotion(): ReactElement {
  return <section className={styles.work} id="work" aria-labelledby="a-work-title"><div className={styles.workIntro}><p className={styles.eyebrow}>04 / The work is the proof</p><h2 id="a-work-title">Automotive Creative Built for the Real Feed</h2><p>Inspect the range: new-car lead generation, event advertising, testimonial videos, employee stories, luxury films, viral concepts, Meta inventory ads, and Google Vehicle Listing Ads.</p></div><div className={styles.mediaRail}><figure className={styles.story}><Image src={`${A}/work-luxury-storyboard.png`} alt="Customer-supplied luxury automotive video storyboard" width={426} height={640} sizes="(max-width: 700px) 74vw, 20vw"/><figcaption>Video creative</figcaption></figure><figure className={styles.campaign}><Image src={`${A}/work-luxury-campaign.png`} alt="Customer-supplied luxury automotive event campaign" width={1122} height={1402} sizes="(max-width: 700px) 74vw, 25vw"/><figcaption>New Car Lead Gen / Event campaigns</figcaption></figure><div className={styles.feedStack}><figure><Image src={`${A}/work-inventory-ad.png`} alt="Customer-supplied Meta inventory advertising example" width={1090} height={596} sizes="(max-width: 700px) 80vw, 27vw"/><figcaption>Inventory advertising</figcaption></figure><figure><Image src={`${A}/work-google-vla.png`} alt="Customer-supplied Google Vehicle Listing Ads example" width={963} height={509} sizes="(max-width: 700px) 80vw, 27vw"/><figcaption>Google Vehicle Listing Ads</figcaption></figure></div></div><a className={styles.primary} href="#options">Explore the Work <span>→</span></a></section>;
}

function ProofWithStandards(): ReactElement {
  const rules=["Show only customer-approved work and attribution","Use testimonial video only after transcript and publication approval","Never imply guaranteed lead volume, CPL, sales, ROAS, or show rate"];
  return <section className={styles.standards} aria-labelledby="a-proof-title"><div><p className={styles.eyebrow}>05 / Proof with standards</p><h2 id="a-proof-title">Proof You Can Inspect. Promises You Can Trust.</h2><div className={styles.ruleGrid}>{rules.map((rule,index)=><article key={rule}><b>{String(index+1).padStart(2,"0")}</b><p>{rule}</p></article>)}</div><p className={styles.about}><strong>Automotive-specialist positioning</strong> BDC Promotions is built around dealership creative, customer engagement, and the operating path from campaign response to showroom opportunity.</p><a href="#growth">See How the Process Works →</a></div><div className={styles.carAbstract} aria-hidden="true"><span/><span/><span/></div></section>;
}

function SupportedOptions(): ReactElement {
  return <section className={styles.options} id="options" aria-labelledby="a-options-title"><p className={styles.optionEyebrow}>Select the support your store needs</p><h2 id="a-options-title">Start With One Service.<br/>Connect the Full Lane.</h2><div className={styles.optionGrid}>{serviceOptions.map(([name,price,term,includes],index)=><article key={name}><p><b>{String(index+1).padStart(2,"0")}</b> {name}</p><h3>{price}</h3><strong>{term}</strong><span>Includes</span><p>{includes}</p></article>)}</div><a className={styles.mix} href={auditHref}>Find the Right Mix <span>→</span></a></section>;
}

function ClearTheLane(): ReactElement {
  return <section className={styles.close} id="contact" aria-labelledby="a-close-title"><div className={styles.closeCopy}><h2 id="a-close-title">Ready to Create More Opportunities for Your Dealership?</h2><p>Tell us what your store needs, or call now to talk through the right mix of creative, media, follow-up, and appointment support.</p><a className={styles.primary} href={auditHref}>Get a Free Dealership Marketing Audit <span>→</span></a><a className={styles.closeCall} href={phoneHref}>Call {phoneDisplay}</a></div><div className={styles.faq}>{faqItems.map(([question,answer],index)=><details key={question}><summary><b>Q{String(index+1).padStart(2,"0")}</b>{question}</summary><p>{answer}</p></details>)}</div></section>;
}

function SignalFooter(): ReactElement { return <footer className={styles.footer}><span>BDC Promotions — Automotive Marketing</span><a href={phoneHref}>{phoneDisplay}</a><a href="mailto:justins@bdc-promotions.com">justins@bdc-promotions.com</a></footer>; }

export function SignalLane(): ReactElement { return <div className={styles.page}><SignalHeader/><main><ShowroomMomentum/><OperatingSignal/><GrowthLane/><WorkInMotion/><ProofWithStandards/><SupportedOptions/><ClearTheLane/></main><SignalFooter/></div>; }
