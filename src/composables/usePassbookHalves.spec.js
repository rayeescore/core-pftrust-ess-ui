import { describe, expect, it } from 'vitest'
import { ALL, NON_TAXABLE, TAXABLE, isHalf, rowFor, summaryFor } from '@/composables/usePassbookHalves'
import { money } from '@/composables/useFormat'

/**
 * The passbook's taxable filter.
 *
 * The control these back was bound to a ref nothing read: a member could press Taxable and watch the
 * highlight move and every figure stay where it was. These pin the two halves of the fix -- that the
 * figures actually change, and that the company share is shown as unclassified rather than as zero.
 */
const month = {
  key: 'm1',
  type: 'month',
  month: 'April',
  pfBase: '50000.00',
  member: '6000.00',
  company: '6000.00',
  vpf: '2000.00',
  interest: null,
  total: '14200.00',
  postedOn: '30-04-2026',
  taxable: { member: '1000.00', vpf: '500.00', interest: '15.00', total: '1515.00' },
  nonTaxable: { member: '5000.00', vpf: '1500.00', interest: '135.00', total: '6635.00' },
}

describe('rowFor', () => {
  it('hands back the row untouched for the unfiltered view', () => {
    expect(rowFor(month, ALL)).toBe(month)
  })

  it('shows the taxable half of each figure', () => {
    const row = rowFor(month, TAXABLE)

    expect(row.member).toBe('1000.00')
    expect(row.vpf).toBe('500.00')
    expect(row.total).toBe('1515.00')
  })

  it('shows the non-taxable half of each figure', () => {
    const row = rowFor(month, NON_TAXABLE)

    expect(row.member).toBe('5000.00')
    expect(row.vpf).toBe('1500.00')
    expect(row.total).toBe('6635.00')
  })

  /**
   * The bug this whole change exists to prevent a second time: a figure that silently stayed whole
   * inside a filtered view. Taxable and non-taxable must not agree on anything the filter applies to.
   */
  it('moves every figure it filters', () => {
    const taxable = rowFor(month, TAXABLE)
    const nonTaxable = rowFor(month, NON_TAXABLE)

    expect(taxable.member).not.toBe(nonTaxable.member)
    expect(taxable.vpf).not.toBe(nonTaxable.vpf)
    expect(taxable.total).not.toBe(nonTaxable.total)
    expect(taxable.member).not.toBe(month.member)
    expect(nonTaxable.total).not.toBe(month.total)
  })

  /**
   * The trust records no taxable classification for the company's contribution, so a half shows none.
   * It has to read as "not classified", and a zero would read as "they paid nothing".
   */
  it('shows no company figure in a half, and renders it as a dash rather than a zero', () => {
    expect(rowFor(month, TAXABLE).company).toBeNull()
    expect(money(rowFor(month, TAXABLE).company)).toBe('—')
    expect(money(rowFor(month, TAXABLE).company)).not.toBe(money(0))
  })

  /** The halves are the member's own money: they sum to the row less the company share. */
  it('sums to the row less the company share', () => {
    const halves =
      Number(rowFor(month, TAXABLE).total) + Number(rowFor(month, NON_TAXABLE).total)

    expect(halves).toBe(8150)
    expect(Number(month.total) - halves).toBe(6050)
  })

  /** A wage is not a balance, so it has no half to choose and is not blanked out. */
  it('leaves the PF base alone', () => {
    expect(rowFor(month, TAXABLE).pfBase).toBe('50000.00')
    expect(rowFor(month, NON_TAXABLE).pfBase).toBe('50000.00')
  })

  it('keeps the fields that describe the row rather than the money', () => {
    const row = rowFor(month, TAXABLE)

    expect(row.month).toBe('April')
    expect(row.postedOn).toBe('30-04-2026')
    expect(row.type).toBe('month')
  })

  /** An event carries one figure, so its half carries one too. */
  it('filters an event amount', () => {
    const credit = {
      key: 'e0',
      type: 'event',
      direction: 'in',
      title: 'Transfer in',
      amount: '3000.00',
      taxable: { amount: '300.00' },
      nonTaxable: { amount: '1700.00' },
    }

    expect(rowFor(credit, TAXABLE).amount).toBe('300.00')
    expect(rowFor(credit, NON_TAXABLE).amount).toBe('1700.00')
    expect(rowFor(credit, TAXABLE).title).toBe('Transfer in')
  })

  /**
   * A server that predates the halves, or a row with nothing classified yet, must not fall back to the
   * whole figure -- that is the failure being fixed. Dashes are the honest answer.
   */
  it('shows dashes rather than the whole figure when a row carries no half', () => {
    const row = rowFor({ key: 'm2', type: 'month', member: '6000.00', total: '14200.00' }, TAXABLE)

    expect(row.member).toBeNull()
    expect(row.total).toBeNull()
    expect(money(row.total)).toBe('—')
  })
})

describe('summaryFor', () => {
  const passbook = {
    opening: '2617990.00',
    contributed: '98400.00',
    transferredIn: '184300.00',
    withdrawn: '120000.00',
    closing: '2780690.00',
    closingLabel: '31 Jul',
    totals: { member: '1185120.00', company: '1275120.00', vpf: '320450.00' },
    taxable: {
      opening: '82720.00',
      contributed: '6060.00',
      transferredIn: '9200.00',
      withdrawn: '4000.00',
      closing: '93980.00',
      totals: { member: '60000.00', vpf: '33980.00' },
    },
    nonTaxable: {
      opening: '1102400.00',
      contributed: '46140.00',
      transferredIn: '82950.00',
      withdrawn: '56000.00',
      closing: '1175490.00',
      totals: { member: '800000.00', vpf: '375490.00' },
    },
  }

  it('hands back the passbook untouched for the unfiltered view', () => {
    expect(summaryFor(passbook, ALL)).toBe(passbook)
  })

  /** Every term of the equation splits, which is what lets the filtered screen keep its summary. */
  it('reconciles inside the taxable half', () => {
    const summary = summaryFor(passbook, TAXABLE)

    expect(
      Number(summary.opening) +
        Number(summary.contributed) +
        Number(summary.transferredIn) -
        Number(summary.withdrawn),
    ).toBe(Number(summary.closing))
  })

  it('reconciles inside the non-taxable half', () => {
    const summary = summaryFor(passbook, NON_TAXABLE)

    expect(
      Number(summary.opening) +
        Number(summary.contributed) +
        Number(summary.transferredIn) -
        Number(summary.withdrawn),
    ).toBe(Number(summary.closing))
  })

  it('carries the closing split, without a company figure', () => {
    const summary = summaryFor(passbook, TAXABLE)

    expect(summary.totals.member).toBe('60000.00')
    expect(summary.totals.vpf).toBe('33980.00')
    expect(money(summary.totals.company)).toBe('—')
  })

  it('keeps the labels the summary is captioned with', () => {
    expect(summaryFor(passbook, TAXABLE).closingLabel).toBe('31 Jul')
  })

  it('shows dashes rather than the whole figures when no half was sent', () => {
    const summary = summaryFor({ opening: '100.00', closing: '100.00' }, TAXABLE)

    expect(money(summary.closing)).toBe('—')
    expect(money(summary.totals.member)).toBe('—')
  })
})

describe('isHalf', () => {
  it('knows when the screen owes the member an explanation', () => {
    expect(isHalf(ALL)).toBe(false)
    expect(isHalf(TAXABLE)).toBe(true)
    expect(isHalf(NON_TAXABLE)).toBe(true)
  })
})
