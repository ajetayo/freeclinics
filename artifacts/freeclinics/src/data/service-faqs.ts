// FAQ content keyed by service slug. The service+location template only
// renders an FAQ section for services that have entries here — services
// without curated FAQs intentionally ship without a FAQ section rather than
// with placeholder content.

import type { FAQ } from '../lib/types';

export const SERVICE_FAQS: Record<string, FAQ[]> = {
  // Sources: Guttmacher Institute, "Minors' Access to STI Services" (state
  // policy table, checked 2026-10-22); CDC GetTested, gettested.cdc.gov.
  'std-testing': [
    {
      question: 'Can I get tested for STDs without insurance?',
      answer:
        "Yes. The clinics listed here serve uninsured patients, and most charge on a sliding scale based on your household income, so testing may be free or low-cost depending on what you earn. Each listing shows the clinic's fee structure; call ahead to confirm what testing costs there.",
    },
    {
      question: 'Do these clinics also test for HIV?',
      answer:
        'Many do. Clinics on this page that list HIV testing among their services are marked "Also tests for HIV". If HIV testing matters to you, confirm it when you call.',
    },
    {
      question: 'Can a teenager get tested without a parent?',
      answer:
        "In every state and Washington, DC, minors can consent to STI testing and treatment themselves, according to the Guttmacher Institute. Eight states set a minimum age (12 or 14, for example), and some states allow or require a provider to notify parents in certain situations, such as a positive HIV test. Ask the clinic about its confidentiality policy when you call.",
    },
    {
      question: "What if there's no clinic close enough?",
      answer:
        "The CDC's GetTested locator (gettested.cdc.gov) lists HIV, STD and hepatitis testing sites across the country, many of them free or low-cost. Your county health department is also worth calling: many run their own STD clinics.",
    },
  ],
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
