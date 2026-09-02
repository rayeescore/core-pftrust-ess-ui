import { describe, expect, it } from 'vitest'
import { displayDate, financialYear, maskTail, money } from '@/composables/useFormat'

/**
 * The formatting rules, which are the ones a member sees get wrong.
 *
 * Note that `money` returns no rupee sign. The ₹ belongs to MoneyDisplay, which sets it smaller and
 * muted so the digits carry -- and which is the only component allowed to render an amount. Testing
 * for it here would pin the symbol to the wrong layer.
 */
describe('money', () => {
  // en-IN grouping: last three digits, then twos. 12,34,567 and never 1,234,567.
  it('groups in the Indian system', () => {
    expect(money('1234567')).toBe('12,34,567')
  })

  it('carries paise when asked, and not otherwise', () => {
    expect(money('1234567', { decimals: true })).toBe('12,34,567.00')
  })

  /**
   * The distinction this portal turns on. `null` means "not computed yet" -- interest before year end,
   * a settlement estimate before the worksheet exists. A zero is a fact and a dash is a wait, and
   * rendering one as the other tells a member something false about their own money.
   */
  it('renders an absent amount as an em dash, never as zero', () => {
    expect(money(null)).toBe('—')
    expect(money(undefined)).toBe('—')
    expect(money('')).toBe('—')
  })

  it('does not turn something unparseable into a number', () => {
    expect(money('not a number')).toBe('—')
  })
})

describe('financialYear', () => {
  /**
   * A financial year is named by the calendar year it ENDS in, so April 2025 belongs to FY 2026.
   * Shown as a bare "2026" a member reads it as the year that has not started yet.
   */
  it('never shows a bare number', () => {
    expect(financialYear(2026)).toBe('FY 2025–26')
  })

  it('has nothing to say about a year nobody gave it', () => {
    expect(financialYear(null)).toBe('—')
  })
})

describe('displayDate', () => {
  /**
   * Parsed by hand rather than through Date(), which reads "08-11-2026" as 8 November in some engines
   * and 11 August in others. Nobody notices until a member reads the wrong date on their own statement.
   */
  it('reads the API dd-MM-yyyy as day-first', () => {
    expect(displayDate('08-11-2026')).toBe('08 Nov 2026')
  })

  it('drops the time from an audit stamp', () => {
    expect(displayDate('02-08-2026 14:30')).toBe('02 Aug 2026')
  })
})

describe('maskTail', () => {
  it('shows the last four and hides the rest', () => {
    expect(maskTail('123456784471')).toBe('••••••••4471')
  })

  /**
   * "Not on record" rather than a dash. aadharNumber, alternateContactNumber and previousCompanyList
   * were never populated by the retired Python importer, so these are blank for older records -- and a
   * member reading a dash assumes the portal is broken rather than that the trust has no value.
   */
  it('says so when the trust holds nothing', () => {
    expect(maskTail(null)).toBe('Not on record')
  })
})
