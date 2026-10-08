import type { FaqItem } from "@/components/schema/builders";

export const blogFaqs = {
  "automotive-dealership-customer-retention": [
    {
      question:
        "What is the first step to improve customer retention at a dealership?",
      answer:
        "Start by defining what a returning customer means for your store, then establish a reliable baseline. Separate service visits from repeat vehicle purchases, and make sure customer and vehicle records can be matched accurately. With that foundation, teams can identify where handoffs, unanswered questions, or missed follow-up interrupt the relationship.",
    },
    {
      question: "How can a CRM support dealership customer retention?",
      answer:
        "A CRM can help staff keep customer and vehicle details, contact preferences, prior conversations, and next actions in one usable record. Its value depends on accurate updates and clear ownership, not simply having software. Dealerships should also respect channel preferences and promptly apply opt-out requests according to applicable requirements.",
    },
    {
      question:
        "How often should a dealership follow up after a vehicle sale?",
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
  ],
  "automotive-marketing-agency-evaluation": [
    {
      question:
        "What should an automotive marketing agency be responsible for?",
      answer:
        "A strong partner should make the path from campaign activity to dealership action clear. That may include paid social strategy and creative, lead response, systematic follow-up, appointment generation, and reporting that shows where prospects moved forward or stalled. Confirm which work the agency owns and which handoffs remain with your team.",
    },
    {
      question:
        "How can a dealership tell whether paid social is producing useful leads?",
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
  ],
} as const satisfies Record<string, readonly FaqItem[]>;
