import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import * as me from '@/api/me'

/**
 * One advance's tracker, mounted.
 *
 * This screen carried two buttons with no handler on them for the whole of the portal's life: "Withdraw
 * this application", beside a sentence promising a member they could do exactly that, and "View" beside
 * each document they had sent. Neither did anything when clicked. Worse, the documents list was always
 * empty — it read `loan.uploadedDocumentList`, a join table nothing in the service has ever written —
 * so the second button was never even on screen to be found wanting.
 *
 * What is pinned here is the three things that made it real: the withdrawal only exists while the API
 * says it would accept one, it takes two taps rather than one, and a refusal shows the API's own
 * sentence instead of a generic failure.
 */

const advance = {
  id: 'loan-1',
  reference: 'PFL/2026-27/00184',
  title: 'Purchase of residential flat',
  appliedOn: '02-08-2026',
  status: { label: 'Under review', tone: 'info' },
  completedSteps: 1,
  steps: [{ label: 'Submitted', when: '02 Aug 2026', state: 'done' }],
  summary: [{ label: 'Amount asked for', value: '300000.00', numeric: true }],
  documents: [{ id: 'doc-1', name: 'Sale Agreement' }],
  receipt: false,
  withdrawable: true,
}

const cancelled = {
  ...advance,
  status: { label: 'Cancelled', tone: 'muted' },
  completedSteps: 0,
  withdrawable: false,
}

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'loan-1' } }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('@/api/me', () => ({
  getLoan: vi.fn(),
  withdrawLoan: vi.fn(),
  getDocumentFile: vi.fn(),
  getLoanReceipt: vi.fn(),
}))

async function open(loan = advance) {
  me.getLoan.mockResolvedValue(loan)
  const View = (await import('@/views/loan/LoanDetailView.vue')).default
  const wrapper = mount(View)
  await flushPromises()
  return wrapper
}

const button = (wrapper, label) =>
  wrapper.findAll('button').find((each) => each.text() === label)

describe('LoanDetailView', () => {
  beforeEach(() => vi.clearAllMocks())

  /**
   * The flag comes from the API, not from reading the status label a second time. An advance in
   * payment may already sit inside a generated bank sheet, and the service answers 409 for it — the
   * button must not be there to be pressed.
   */
  it('offers no withdrawal when the API says it would not accept one', async () => {
    const wrapper = await open({ ...advance, status: { label: 'Paid', tone: 'success' }, withdrawable: false })

    expect(wrapper.text()).not.toContain('Withdraw this application')
    expect(wrapper.text()).not.toContain('While this is open')
  })

  /**
   * Two taps. A correction withdraws on the first, and that is right for a sentence that costs nothing
   * to raise again; an advance is five steps and re-uploaded documents, and the button sits in a
   * phone-width column next to a Download.
   */
  it('asks before it withdraws, and does nothing until the second tap', async () => {
    const wrapper = await open()

    await button(wrapper, 'Withdraw this application').trigger('click')

    expect(me.withdrawLoan).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('This cannot be undone.')

    await button(wrapper, 'Keep it').trigger('click')

    expect(me.withdrawLoan).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Withdraw this application')
  })

  /**
   * The record is replaced with what the API answered rather than patched locally: the chip, the
   * tracker and the disappearance of the button itself all follow from one response.
   */
  it('replaces the advance with what the API answers', async () => {
    me.withdrawLoan.mockResolvedValue(cancelled)
    const wrapper = await open()

    await button(wrapper, 'Withdraw this application').trigger('click')
    await button(wrapper, 'Yes, withdraw it').trigger('click')
    await flushPromises()

    expect(me.withdrawLoan).toHaveBeenCalledWith('loan-1')
    expect(wrapper.text()).toContain('Cancelled')
    expect(wrapper.text()).not.toContain('Withdraw this application')
  })

  /**
   * A 409 means an approver moved it on while this page was open. The API writes that sentence for the
   * member to read — naming what happened to their application — so it is shown as it arrives.
   */
  it("shows the API's own sentence when the withdrawal is refused", async () => {
    me.withdrawLoan.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message:
            'This advance has been approved and the payment is being made, so it can no longer be taken back.',
        },
      },
    })
    const wrapper = await open()

    await button(wrapper, 'Withdraw this application').trigger('click')
    await button(wrapper, 'Yes, withdraw it').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('the payment is being made')
    expect(wrapper.text()).toContain('Under review')
  })

  /** The attachment is fetched by its own id — the name alone downloads nothing. */
  it('downloads an attachment by the id the API sent with it', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:fixture')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    me.getDocumentFile.mockResolvedValue({ blob: new Blob(['%PDF']), filename: 'document.pdf' })

    const wrapper = await open()

    expect(wrapper.text()).toContain('Sale Agreement')

    await button(wrapper, 'Download').trigger('click')
    await flushPromises()

    expect(me.getDocumentFile).toHaveBeenCalledWith('doc-1')
  })

  /** Nothing attached, no panel — rather than an empty "Documents you sent" heading. */
  it('leaves the documents panel out when there are none', async () => {
    const wrapper = await open({ ...advance, documents: [] })

    expect(wrapper.text()).not.toContain('Documents you sent')
  })
})
