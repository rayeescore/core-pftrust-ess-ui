import { describe, expect, it } from 'vitest'
import { changeOf, partition, summary, title } from '@/composables/useChangeRequests'

/**
 * How a correction the member has already asked for is worded back to them.
 *
 * All of it is reading, never deciding: `label` is the server's (`ChangeRequestField.label()`), and
 * so are `status` and `pending`. What lives here is the part two screens would otherwise word
 * differently -- the profile card and the history list show the same request, and did so through two
 * copies of the same join until this file existed.
 */
const item = (label, over = {}) => ({
  field: 'MOBILE',
  label,
  subject: null,
  currentValue: null,
  requestedValue: null,
  ...over,
})

describe('title', () => {
  it('names the field on its own when the change is not about somebody', () => {
    expect(title(item('Mobile number'))).toBe('Mobile number')
  })

  /** A nomination changes one named person's share, and which person is the whole point. */
  it('names the nominee when there is one', () => {
    expect(title(item('Nominee', { subject: 'Rohan Deshmukh' }))).toBe('Nominee · Rohan Deshmukh')
  })
})

describe('summary', () => {
  it('lists every field the request touches', () => {
    const request = { items: [item('Mobile number'), item('Email address')] }

    expect(summary(request)).toBe('Mobile number, Email address')
  })

  /**
   * The record filters its items to the active ones, so a request can arrive with none. An empty
   * summary line would read as a broken row; a member should still be able to tell there is a request
   * there and open it.
   */
  it('still says something when no item survives', () => {
    expect(summary({ items: [] })).toBe('A correction')
    expect(summary({})).toBe('A correction')
  })
})

describe('changeOf', () => {
  it('reads a plain before and after', () => {
    const change = changeOf(item('Mobile number', { currentValue: '98765 43210', requestedValue: '99887 76655' }))

    expect(change).toMatchObject({ from: '98765 43210', to: '99887 76655' })
  })

  /**
   * Null is not empty, and the API says so deliberately -- `MemberChangeRequestRecord.value` keeps
   * null rather than collapsing it to a dash, because "not on record" and "blank" are different facts.
   * Both ends are read back in those words, and "Not on record" is the wording the correction form's
   * own diff already uses, so a member meets one phrase rather than two.
   */
  it('says a nominee being added was not on record before', () => {
    const change = changeOf(item('Nominee', { subject: 'Aarti', currentValue: null, requestedValue: '25' }))

    expect(change).toMatchObject({ from: 'Not on record', to: '25', added: true, removed: false })
  })

  /**
   * The one a blank box would get wrong. Removing a nominee is sent as a requested value of null, so
   * a row that simply printed the value would show the member an empty space where they had asked for
   * somebody to be taken off their nomination.
   */
  it('says a nominee being taken off is a removal', () => {
    const change = changeOf(item('Nominee', { subject: 'Aarti', currentValue: '25', requestedValue: null }))

    expect(change).toMatchObject({ from: '25', to: 'Removed', added: false, removed: true })
  })
})

describe('partition', () => {
  const underReview = { id: 'a', pending: true }
  const applied = { id: 'b', pending: false }

  /**
   * `pending` is the API's, not a reading of the label. It is what the withdraw handler will actually
   * accept, so the button is offered on exactly the requests the API would take it for.
   */
  it('splits on what the API says is still open', () => {
    expect(partition([underReview, applied])).toEqual({ pending: [underReview], decided: [applied] })
  })

  it('holds the order it was given, which is newest first', () => {
    const older = { id: 'c', pending: false }

    expect(partition([applied, older]).decided).toEqual([applied, older])
  })

  it('copes with nothing at all', () => {
    expect(partition([])).toEqual({ pending: [], decided: [] })
    expect(partition(null)).toEqual({ pending: [], decided: [] })
  })
})
