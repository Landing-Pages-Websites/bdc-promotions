import type { FaqItem } from "@/components/schema/builders";

const customerRetentionFaq: readonly FaqItem[] = [
  {
    question: "What is the first step to improve customer retention at a dealership?",
    answer:
      "Start by defining what a returning customer means for your store, then establish a reliable baseline. Separate service visits from repeat vehicle purchases, and make sure customer and vehicle records can be matched accurately. With that foundation, teams can identify where handoffs, unanswered questions, or missed follow-up interrupt the relationship.",
  },
  {
    question: "How can a CRM support dealership customer retention?",
    answer:
      "A CRM can help staff keep customer and vehicle details, contact preferences, prior conversations, and next actions in one usable record. Its value depends on accurate updates and clear ownership, not simply having software. Dealerships should also respect channel preferences and promptly apply opt-out requests according to applicable requirements.",
  },
  {
    question: "How often should a dealership follow up after a vehicle sale?",
    answer:
      "There is no universal schedule that fits every customer or store. Plan communication around a useful reason, such as confirming the delivery experience, answering an open question, or sharing a relevant service reminder. Consider the customer's preferred channel and the dealership's consent records. Stop or adjust outreach when a customer asks, and avoid sending repeated messages that add no value.",
  },
  {
    question: "Which metrics help measure customer retention?",
    answer:
      "Choose a defined customer group and time period, then track repeat service visits and repeat purchases where those records are available. Pair those outcomes with operational measures such as completed follow-ups, appointment attendance, unresolved inquiries, and opt-outs. Review results by customer group and channel so the team can distinguish a relationship issue from a data or process gap.",
  },
  {
    question: "Can dealerships use recall notices as marketing messages?",
    answer:
      "Recall communication should be handled as a safety and service matter, not disguised as a sales promotion. Check vehicle-specific information through NHTSA's recall resources, follow manufacturer guidance, and direct customers to the appropriate dealership service contact. Keep the message clear about the safety-related next step.",
  },
];

const marketingAgencyEvaluationFaq: readonly FaqItem[] = [
  {
    question: "What should an automotive marketing agency be responsible for?",
    answer:
      "A strong partner should make the path from campaign activity to dealership action clear. That may include paid social strategy and creative, lead response, systematic follow-up, appointment generation, and reporting that shows where prospects moved forward or stalled. Confirm which work the agency owns and which handoffs remain with your team.",
  },
  {
    question: "How can a dealership tell whether paid social is producing useful leads?",
    answer:
      "Do not stop at impressions or lead volume. Review lead quality, response speed, conversations, qualified opportunities, appointments, and the follow-up status of each lead. This separates attention from actions that your sales or BDC team can actually work.",
  },
  {
    question: "Why does speed-to-lead matter when evaluating an agency?",
    answer:
      "Interest can fade when a shopper does not receive a timely response. Ask how inquiries are routed, who replies, what happens when a lead is not reached, and how follow-up is documented. Messenger response and a defined follow-up process can help keep shoppers engaged and move them toward the next buying step.",
  },
  {
    question: "How much does dealership marketing agency support cost?",
    answer:
      "There is no responsible one-size-fits-all answer because scope depends on the channels, creative requirements, response workflow, reporting, and level of support involved. Request a written agreement that defines deliverables, ownership, approvals, data access, and measurement before comparing proposals. BDC Promotions does not publish standard pricing; engagements are governed by written agreements.",
  },
];

const dealershipMessengerLeadWorkflowFaq: readonly FaqItem[] = [
  {
    question: "What is included in a dealership Messenger lead workflow?",
    answer:
      "A practical workflow covers more than sending a first reply. It identifies new Messenger inquiries, captures conversation context, assigns ownership, provides a helpful response, qualifies the shopper, supports an appropriate next step, and records the outcome. The exact process depends on dealership staffing, systems, and agreed service scope.",
  },
  {
    question: "Who should own an inbound Messenger lead?",
    answer:
      "Ownership should be clear as soon as the inquiry arrives. Depending on the dealership, that may be a BDC representative, sales team member, or another assigned responder. The workflow should define who monitors the channel, who handles questions, when a lead is handed off. And how context is preserved so the shopper does not need to repeat information.",
  },
  {
    question: "How should a dealership qualify a Messenger conversation?",
    answer:
      "Start with the shopper's stated intent, then ask only the questions needed to guide the next step. Useful context may include the vehicle or offer of interest, purchase timing, and the shopper's preferred way to continue. Qualification should support a relevant response and a possible appointment, not turn the opening exchange into a rigid form.",
  },
  {
    question: "What should happen if a Messenger lead does not reply?",
    answer:
      "Use a dealership-approved follow-up plan that is respectful and appropriate to the conversation. Record the attempted contact, stop when the shopper asks not to be contacted. And escalate to a human when the question is sensitive, complex, or ready for direct sales assistance. There is no universal cadence that fits every dealership or shopper.",
  },
  {
    question: "How is a dealership Messenger workflow measured?",
    answer:
      "Review both process coverage and business outcomes. Useful checks include whether inquiries received an owner, whether conversations became two-way exchanges, whether qualification and handoff context were captured, and whether appointments and later outcomes were visible to the team. Compare results against a consistent dealership baseline rather than relying on lead volume alone.",
  },
];

const messengerVsEmailFaq: readonly FaqItem[] = [
  {
    question: "Is Messenger better than email for car dealership leads?",
    answer:
      "Not in every case. Messenger is well suited to quick, conversational exchanges, while email works well for detailed information and written follow-up. The better choice depends on the shopper's entry point, preference, inquiry, and the dealership's ability to respond.",
  },
  {
    question: "Does Messenger always get a higher response rate?",
    answer:
      "No. Do not assume a universal response-rate advantage. Compare your own inquiries using consistent definitions, similar lead sources, and a clear time window. Staffing and message quality can affect results as much as channel selection.",
  },
  {
    question: "Should a dealership follow up by email after a Messenger conversation?",
    answer:
      "Only when email adds value and the shopper has provided or requested that contact method. It may be helpful for requested details or confirmation, but avoid duplicating messages or making the shopper repeat information.",
  },
  {
    question: "What should a dealership measure first?",
    answer:
      "Start with time to first meaningful response, meaningful shopper replies, conversation progression, and appointments that are actually agreed and recorded. Define each measure before comparing channels.",
  },
];

export const blogFaqBySlug: Readonly<Record<string, readonly FaqItem[]>> = {
  "automotive-dealership-customer-retention": customerRetentionFaq,
  "automotive-marketing-agency-evaluation": marketingAgencyEvaluationFaq,
  "messenger-vs-email-for-car-dealership-leads": messengerVsEmailFaq,
  "dealership-messenger-lead-workflow": dealershipMessengerLeadWorkflowFaq,
};
