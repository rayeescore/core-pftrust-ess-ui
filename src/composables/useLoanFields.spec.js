import { describe, expect, it } from 'vitest'
import {
  COMPLETION_DATE,
  PROPERTY_COSTS,
  REPAYMENT_BANK,
  asks,
  costQuestion,
  propertyFor,
  repaymentBankFor,
} from '@/composables/useLoanFields'

/**
 * Which questions each advance purpose puts.
 *
 * This used to be `group === 'Housing'`, which is the trust's *eligibility* grouping and not a
 * statement about property. It held for the seven codes the master shipped with and stopped holding
 * the day V0_0_111 added code 06, a pension withdrawal, to the same group -- at which point a member
 * applying for a pension was asked to itemise a flat they were not buying. The answer now comes from
 * the server, per purpose, and these tests pin the reading of it rather than the rule itself.
 */
const purpose = (code, ...fields) => ({ code, title: code, asks: fields })

describe('asks', () => {
  it('reads what the purpose says it asks for', () => {
    expect(asks(purpose('01', PROPERTY_COSTS), PROPERTY_COSTS)).toBe(true)
    expect(asks(purpose('02', COMPLETION_DATE), COMPLETION_DATE)).toBe(true)
    expect(asks(purpose('13', REPAYMENT_BANK), REPAYMENT_BANK)).toBe(true)
  })

  /**
   * The two that were wrong before. An alteration is asked when the house was finished and for none of
   * the costs; a repayment is asked for the lender and for no property at all.
   */
  it('does not ask an alteration to itemise a property', () => {
    expect(asks(purpose('02', COMPLETION_DATE), PROPERTY_COSTS)).toBe(false)
  })

  it('does not ask a repayment of a housing loan to itemise a property', () => {
    expect(asks(purpose('13', REPAYMENT_BANK), PROPERTY_COSTS)).toBe(false)
  })

  it('asks nothing extra of a purpose that asks nothing extra', () => {
    const marriage = purpose('03')
    expect(asks(marriage, PROPERTY_COSTS)).toBe(false)
    expect(asks(marriage, COMPLETION_DATE)).toBe(false)
    expect(asks(marriage, REPAYMENT_BANK)).toBe(false)
  })

  /**
   * A purpose that arrives without the key at all -- no purpose chosen yet, or a server that predates
   * it. Asking nothing is the safe answer: the member can still submit, and the PF department collects
   * what it needs. Guessing is what put a property form in front of a pension.
   */
  it('asks nothing when the server did not say', () => {
    expect(asks({ code: '01' }, PROPERTY_COSTS)).toBe(false)
    expect(asks(null, PROPERTY_COSTS)).toBe(false)
    expect(asks(undefined, PROPERTY_COSTS)).toBe(false)
  })
})

describe('costQuestion', () => {
  /**
   * The amount step asked "What will the flat cost in total?" of every purpose -- of a marriage, of a
   * hospital admission, of a pre-retirement withdrawal. It is the first question on the screen.
   */
  it('asks about a flat only where a flat is being bought', () => {
    expect(costQuestion(purpose('01', PROPERTY_COSTS)).label).toMatch(/property/i)
    expect(costQuestion(purpose('03')).label).not.toMatch(/flat|property/i)
  })

  it('asks a repayment what is still owed rather than what something costs', () => {
    expect(costQuestion(purpose('13', REPAYMENT_BANK)).label).toMatch(/outstanding/i)
  })

  it('asks an alteration about the work', () => {
    expect(costQuestion(purpose('02', COMPLETION_DATE)).label).toMatch(/work/i)
  })

  it('falls back to a question that fits any purpose', () => {
    const question = costQuestion(null)
    expect(question.label.length).toBeGreaterThan(0)
    expect(question.hint.length).toBeGreaterThan(0)
  })

  it('always carries a hint, because the figure is the whole cost and not the part asked for', () => {
    for (const p of [purpose('01', PROPERTY_COSTS), purpose('02', COMPLETION_DATE), purpose('13', REPAYMENT_BANK), purpose('03')]) {
      expect(costQuestion(p).hint).toBeTruthy()
    }
  })
})

/**
 * What the draft should hold after the member goes back and picks a different purpose.
 *
 * A five-step flow lets them change their mind at step 5 and return to step 1, and the half-filled
 * answers to the old purpose's questions are still sitting in the draft. Anything left behind is sent
 * on submit; the API drops what the new purpose did not ask for, but a figure the member cannot see
 * and cannot clear should not be travelling with their application at all.
 */
describe('propertyFor', () => {
  it('is nothing at all for a purpose that asks about no property', () => {
    expect(propertyFor(purpose('03'), { agreementValue: '4200000' })).toBeNull()
    expect(propertyFor(purpose('06'), { agreementValue: '4200000' })).toBeNull()
  })

  it('starts a purchase off with the cost fields it asks for', () => {
    const block = propertyFor(purpose('01', PROPERTY_COSTS), null)
    expect(block).toMatchObject({ agreementValue: '', stampDuty: '', registration: '' })
  })

  it('keeps what the member already typed when the purpose still asks for it', () => {
    const block = propertyFor(purpose('01', PROPERTY_COSTS), { agreementValue: '4200000' })
    expect(block.agreementValue).toBe('4200000')
  })

  /**
   * The case the old reset missed. Both 01 and 02 are "housing", so a single needsProperty check kept
   * the block whole across the switch -- and an agreement value typed for a flat travelled on an
   * alteration, which the trust records no costs for at all.
   */
  it('drops a purchase’s costs when the member switches to an alteration', () => {
    const block = propertyFor(purpose('02', COMPLETION_DATE), {
      agreementValue: '4200000',
      stampDuty: '252000',
    })
    expect(block.agreementValue).toBeUndefined()
    expect(block.stampDuty).toBeUndefined()
    expect(block).toHaveProperty('dateOfCompletionOfHouse')
  })

  it('drops an alteration’s date when the member switches to a purchase', () => {
    const block = propertyFor(purpose('01', PROPERTY_COSTS), {
      dateOfCompletionOfHouse: '2019-04-12',
    })
    expect(block.dateOfCompletionOfHouse).toBeUndefined()
  })
})

describe('repaymentBankFor', () => {
  /**
   * The lender's account is where the money goes on code 13. Carrying it onto any other purpose would
   * leave an account number the trust has no business holding attached to an advance paid to the
   * member.
   */
  it('is nothing at all for a purpose paid to the member', () => {
    expect(repaymentBankFor(purpose('01', PROPERTY_COSTS), { accountNumber: '50200012345678' })).toBeNull()
  })

  it('starts a repayment off with the lender fields', () => {
    expect(repaymentBankFor(purpose('13', REPAYMENT_BANK), null)).toMatchObject({
      financialInstituteName: '',
      accountNumber: '',
    })
  })

  it('keeps what the member already typed about the lender', () => {
    const block = repaymentBankFor(purpose('13', REPAYMENT_BANK), { bank: 'HDFC' })
    expect(block.bank).toBe('HDFC')
  })
})
