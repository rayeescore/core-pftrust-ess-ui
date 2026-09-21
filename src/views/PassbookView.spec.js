import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/**
 * The passbook, mounted, pressing its own taxable filter.
 *
 * **This is the test the bug got past.** `taxView` was bound to the segmented control and read by
 * nothing: the rule that halves the figures did not exist, the payload carried no halves to apply it
 * to, and a member pressing Taxable watched the highlight slide and every rupee stay exactly where it
 * was. `usePassbookHalves.spec.js` pins the rule; nothing but mounting the page pins that the control
 * is wired to it, which is the part that was actually broken.
 *
 * So these assert through the rendered text, and deliberately compare the three views against each
 * other rather than against literals -- a filter that silently did nothing would satisfy any single
 * snapshot of one view.
 */
const passbook = {
  openingLabel: '01 Apr',
  closingLabel: '31 Jul',
  closingDate: '31-07-2026',
  opening: '100000.00',
  contributed: '24000.00',
  transferredIn: '6000.00',
  withdrawn: '10000.00',
  closing: '120000.00',
  lastRate: '8.25',
  totals: { member: '50000.00', company: '50000.00', vpf: '20000.00' },
  taxable: {
    opening: '8000.00',
    contributed: '3000.00',
    transferredIn: '900.00',
    withdrawn: '1400.00',
    closing: '10500.00',
    totals: { member: '6300.00', vpf: '4200.00' },
  },
  nonTaxable: {
    opening: '72000.00',
    contributed: '9000.00',
    transferredIn: '3100.00',
    withdrawn: '4600.00',
    closing: '79500.00',
    totals: { member: '47700.00', vpf: '31800.00' },
  },
  rows: [
    {
      key: 'apr',
      type: 'month',
      month: 'April',
      pfBase: '90000.00',
      member: '10800.00',
      company: '10800.00',
      vpf: '3000.00',
      total: '24600.00',
      postedOn: '30-04-2026',
      taxable: { member: '1100.00', vpf: '400.00', total: '1500.00' },
      nonTaxable: { member: '9700.00', vpf: '2600.00', total: '12300.00' },
    },
  ],
}

vi.mock('@/api/me', () => ({
  getPassbook: vi.fn(async () => passbook),
  getContributedYears: vi.fn(async () => [2027]),
  getMonthlyStatement: vi.fn(),
}))

async function mountPassbook() {
  const View = (await import('@/views/PassbookView.vue')).default
  const wrapper = mount(View)
  await flushPromises()
  return wrapper
}

/** The three tabs, in the order the control draws them. */
async function press(wrapper, label) {
  const tab = wrapper.findAll('[role="tab"]').find((button) => button.text() === label)
  expect(tab, `no tab labelled ${label}`).toBeTruthy()
  await tab.trigger('click')
  return wrapper.text()
}

describe('PassbookView taxable filter', () => {
  it('starts on All, showing the whole account', async () => {
    const text = (await mountPassbook()).text()

    expect(text).toContain('1,20,000') // closing balance
    expect(text).toContain('24,600') // April's total
  })

  /** The regression itself: pressing a tab has to change the figures on screen. */
  it('changes every figure when Taxable is pressed', async () => {
    const wrapper = await mountPassbook()
    const before = wrapper.text()

    const after = await press(wrapper, 'Taxable')

    expect(after).not.toBe(before)
    expect(after).toContain('10,500') // the taxable closing balance
    expect(after).toContain('1,500') // April's taxable total
    expect(after).not.toContain('1,20,000') // the whole balance is gone
    expect(after).not.toContain('24,600')
  })

  it('shows the non-taxable half, which is a different half again', async () => {
    const wrapper = await mountPassbook()

    const taxable = await press(wrapper, 'Taxable')
    const nonTaxable = await press(wrapper, 'Non-taxable')

    expect(nonTaxable).not.toBe(taxable)
    expect(nonTaxable).toContain('79,500') // the non-taxable closing balance
    expect(nonTaxable).toContain('12,300') // April's non-taxable total
    expect(nonTaxable).not.toContain('10,500')
  })

  it('goes back to the whole account when All is pressed again', async () => {
    const wrapper = await mountPassbook()
    const before = wrapper.text()

    await press(wrapper, 'Taxable')

    expect(await press(wrapper, 'All')).toBe(before)
  })

  /**
   * The company's contribution carries no taxable classification, so a half must not print one -- and
   * must say why, because an unexplained blank on a money column is what sends a member to the PF
   * department.
   */
  it('explains the empty company column instead of printing a figure for it', async () => {
    const wrapper = await mountPassbook()

    expect(wrapper.text()).not.toContain('Company contribution is not shown')

    const after = await press(wrapper, 'Taxable')

    expect(after).toContain('Company contribution is not shown in this view')
    expect(after).not.toContain('50,000') // the company total is not printed in a half
    expect(after).not.toContain('10,800') // nor April's company share
  })

  /** A half is the member's own money, and the caption says so rather than claiming a full balance. */
  it('captions the balance as a half', async () => {
    const wrapper = await mountPassbook()

    expect(await press(wrapper, 'Taxable')).toContain('taxable balance')
    expect(await press(wrapper, 'Non-taxable')).toContain('non-taxable balance')
  })

  /** The PF base is the wage the contribution was worked out on, not money in the account. */
  it('leaves the PF base alone in every view', async () => {
    const wrapper = await mountPassbook()

    expect(await press(wrapper, 'Taxable')).toContain('90,000')
    expect(await press(wrapper, 'Non-taxable')).toContain('90,000')
  })
})
