/**
 * Which extra questions an advance purpose puts, and how to word the one every purpose puts.
 *
 * **The purpose says, and this file only reads.** `GET /me/loans/types` returns an `asks` array per
 * purpose, from `LoanApplicationField` in the service -- the same map the staff form's three `v-if`
 * blocks have always applied by hand. Keeping the rule there rather than here is what stops the two
 * forms drifting: a purchase and an alteration ask different things, and until a release ago the
 * portal asked them the same thing.
 *
 * **This replaced `group === 'Housing'`, and the reason matters.** `loan_group` is the trust's
 * *eligibility* grouping: it decides what a purpose is worth, not what a form has to collect. It
 * happened to line up with "involves a property" for the seven codes V0_0_30 shipped, and stopped the
 * day V0_0_111 put code 06 -- Pension on Heigher Wages -- in group A. A member applying for a pension
 * was then asked to itemise a flat, and a member repaying a housing loan was asked for a property the
 * trust records nothing of. Neither was a wrong `v-if`; both were the wrong question being asked of
 * the data.
 */

/** Agreement value, stamp duty, registration, insurance, anything else. Codes 01, 10, 11, 12, 14. */
export const PROPERTY_COSTS = 'propertyCosts'

/** When the house was finished. Code 02 alone, which is asked for none of the costs. */
export const COMPLETION_DATE = 'completionDate'

/** The lender being repaid. Code 13 alone, the one purpose paid to somebody other than the member. */
export const REPAYMENT_BANK = 'repaymentBank'

/**
 * Whether this purpose asks for that field.
 *
 * A purpose with no `asks` at all -- none chosen yet, or a server that predates it -- asks nothing.
 * That is the safe answer rather than a guess: the member can still submit and the PF department
 * collects what it needs, where a guess is what put a property form in front of a pension.
 */
export function asks(purpose, field) {
  return Array.isArray(purpose?.asks) && purpose.asks.includes(field)
}

/**
 * The one question every purpose puts -- what the whole thing costs -- in words that fit the purpose.
 *
 * Derived from what the purpose asks rather than from a table of thirteen strings, so a code the trust
 * adds gets a sentence that is true of it rather than one about a flat. The wording lives here and not
 * in the service because it is copy, not a rule: the service says *what* is asked, the portal says how
 * it is put.
 */
export function costQuestion(purpose) {
  if (asks(purpose, PROPERTY_COSTS)) {
    return {
      label: 'What will the property cost in total?',
      hint: 'Agreement value plus stamp duty, registration and anything else you are paying for.',
    }
  }

  if (asks(purpose, REPAYMENT_BANK)) {
    return {
      label: 'How much is outstanding on the loan?',
      hint: 'What is still owed to the lender today, not what you originally borrowed.',
    }
  }

  if (asks(purpose, COMPLETION_DATE)) {
    return {
      label: 'What will the work cost in total?',
      hint: 'The whole cost of the alteration, not just the part you want from your PF.',
    }
  }

  return {
    label: 'What will this cost in total?',
    hint: 'The whole cost of what you are applying for, not just the part you want from your PF.',
  }
}

/** The cost fields, in the order the form puts them. Exported so the form and this agree on the set. */
export const PROPERTY_COST_FIELDS = [
  { key: 'agreementValue', label: 'Agreement value' },
  { key: 'stampDuty', label: 'Stamp duty' },
  { key: 'registration', label: 'Registration' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'others', label: 'Anything else' },
]

const REPAYMENT_BANK_FIELDS = [
  { key: 'financialInstituteName', label: 'Lender' },
  { key: 'bank', label: 'Bank' },
  { key: 'branch', label: 'Branch' },
  { key: 'accountNumber', label: 'Account number', mono: true },
  { key: 'ifscCode', label: 'IFSC', mono: true },
  { key: 'micrCode', label: 'MICR', mono: true },
]

export { REPAYMENT_BANK_FIELDS }

/** Blank for each key, with whatever the member already typed against those keys carried over. */
function carry(keys, existing) {
  return Object.fromEntries(keys.map((key) => [key, existing?.[key] ?? '']))
}

/**
 * The property block this purpose should hold, given whatever the draft holds now.
 *
 * A five-step flow lets a member reach step 5 and go back to step 1, so the answers to the previous
 * purpose's questions are still in the draft when the new purpose's form is drawn. Only the keys the
 * new purpose asks for survive: an agreement value typed for a flat must not travel on an alteration,
 * which the trust records no costs for, nor a completion date on a purchase. The API drops both, but a
 * figure the member can neither see nor clear should not be attached to their application at all.
 */
export function propertyFor(purpose, existing) {
  const keys = [
    ...(asks(purpose, COMPLETION_DATE) ? ['dateOfCompletionOfHouse'] : []),
    ...(asks(purpose, PROPERTY_COSTS) ? PROPERTY_COST_FIELDS.map((field) => field.key) : []),
  ]

  return keys.length ? carry(keys, existing) : null
}

/**
 * The lender block, on the one purpose that has one.
 *
 * Null everywhere else, and that is the more important half: on any purpose but 13 the advance is paid
 * to the member, so a lender's account carried over from an abandoned code-13 draft would be an account
 * number the trust has no business holding beside it.
 */
export function repaymentBankFor(purpose, existing) {
  return asks(purpose, REPAYMENT_BANK)
    ? carry(REPAYMENT_BANK_FIELDS.map((field) => field.key), existing)
    : null
}
