// FAQ content keyed by service slug. The service+location template only
// renders an FAQ section for services that have entries here — services
// without curated FAQs intentionally ship without a FAQ section rather than
// with placeholder content.

import type { FAQ } from '../lib/types';

export const SERVICE_FAQS: Record<string, FAQ[]> = {
  'womens-health': [
    {
      question: "Can I get a Pap smear if I don't have insurance?",
      answer:
        "Yes. Most community health centers and Planned Parenthood locations offer Pap smears on a sliding-scale basis, where the cost is determined by your household income. Many patients also qualify for free cervical cancer screening through their state's Breast and Cervical Cancer Program.",
    },
    {
      question: "Do I need to be a US citizen to be seen at a free or low-cost clinic?",
      answer:
        "No. Federally Qualified Health Centers and most community clinics serve patients regardless of immigration status. You will not be asked about citizenship in order to receive care, and most clinics do not require a Social Security number.",
    },
    {
      question: "What documents should I bring to my first appointment?",
      answer:
        "Most clinics ask for a photo ID (any government-issued ID is fine), proof of income for the most recent month (a pay stub, an unemployment letter, or a self-attestation form the clinic provides), and proof of address (a utility bill or piece of mail). If you have any insurance card, bring that too.",
    },
    {
      question: "Is birth control actually free at these clinics?",
      answer:
        "Often, yes. Birth control — including IUDs and implants — is fully covered by Medicaid in every state, and most low-cost clinics provide it free or near-free to uninsured patients who qualify under the sliding fee scale.",
    },
  ],
};
