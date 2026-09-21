import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/**
 * The correction history, mounted.
 *
 * **The first component test in this repo**, and here rather than in a composable spec because what
 * this screen can get wrong is not arithmetic. `changeOf`'s null semantics are pinned next door in
 * `useChangeRequests.spec.js`; what is pinned here is that they survive the journey to the page -- a
 * nominee being taken off reads "Removed" and not a blank space, an added one reads "Not on record",
 * and a share keeps the per-cent sign it carries everywhere else a member meets it.
 *
 * The other three are states a member reaches by clicking: the request still under review is open on
 * arrival, a decided one opens on demand and only then shows why it was refused, and withdrawing
 * replaces the row with what the API answered rather than patching the status locally.
 */

const requests = [
  {
    id: 'r1',
    raisedOn: '14-09-2026',
    status: { label: 'Under review', tone: 'info' },
    pending: true,
    note: 'The number changed when I moved.',
    hasAttachment: true,
    items: [
      { field: 'MOBILE', label: 'Mobile number', subject: null, currentValue: '98765 43210', requestedValue: '99887 76655' },
      { field: 'NOMINEE', label: 'Nominee', subject: 'Aarti', currentValue: '25', requestedValue: null },
      { field: 'NOMINEE', label: 'Nominee', subject: 'Rohan', currentValue: null, requestedValue: '25' },
    ],
  },
  {
    id: 'r2',
    raisedOn: '02-08-2026',
    decidedOn: '05-08-2026',
    status: { label: 'Not accepted', tone: 'danger' },
    pending: false,
    hasAttachment: false,
    decisionReason: 'The cheque was not legible.',
    items: [{ field: 'BANK_ACCOUNT_NUMBER', label: 'Account number', subject: null, currentValue: 'XXXXXXXX1234', requestedValue: 'XXXXXXXX9988' }],
  },
]

const withdrawn = { ...requests[0], pending: false, decidedOn: '21-09-2026', status: { label: 'Withdrawn', tone: 'muted' } }

vi.mock('@/api/me', () => ({
  getChangeRequests: vi.fn(async () => requests),
  withdrawChangeRequest: vi.fn(async () => withdrawn),
  getChangeRequestAttachment: vi.fn(),
}))

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

describe('ChangeRequestHistoryView', () => {
  it('renders every request, expands the pending one, and reads the diffs back', async () => {
    const View = (await import('@/views/ChangeRequestHistoryView.vue')).default
    const wrapper = mount(View, { global: { stubs } })
    await flushPromises()

    const text = wrapper.text()

    expect(wrapper.findAll('article')).toHaveLength(2)
    expect(text).toContain('Mobile number, Nominee · Aarti, Nominee · Rohan')
    expect(text).toContain('Asked 14 Sep 2026')
    expect(text).toContain('decided 05 Aug 2026')

    // The pending one is open on arrival, so its diffs and its actions are on screen.
    expect(text).toContain('99887 76655')
    expect(text).toContain('Removed')          // nominee taken off, not a blank
    expect(text).toContain('Not on record')    // nominee added
    expect(text).toContain('25%')              // share carries its unit
    expect(text).toContain('Withdraw it')
    expect(text).toContain('View the proof you sent')

    // The decided one is closed, so its reason is not.
    expect(text).not.toContain('The cheque was not legible.')
  })

  it('opens a decided request and shows why it was refused', async () => {
    const View = (await import('@/views/ChangeRequestHistoryView.vue')).default
    const wrapper = mount(View, { global: { stubs } })
    await flushPromises()

    await wrapper.findAll('article')[1].find('button').trigger('click')

    expect(wrapper.text()).toContain('The cheque was not legible.')
    expect(wrapper.text()).toContain('XXXXXXXX9988')
  })

  it('replaces the row with what the API answers when it is withdrawn', async () => {
    const View = (await import('@/views/ChangeRequestHistoryView.vue')).default
    const wrapper = mount(View, { global: { stubs } })
    await flushPromises()

    const buttons = wrapper.findAll('article')[0].findAll('button')
    await buttons.find((button) => button.text() === 'Withdraw it').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Withdrawn')
    expect(wrapper.text()).not.toContain('Withdraw it')
  })
})
