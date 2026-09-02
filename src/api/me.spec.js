import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

import client from '@/api/client'
import * as me from '@/api/me'

/**
 * The member API, as this app calls it.
 *
 * The assertion that matters in every one of these is the absence: no call carries an identifier for a
 * person. The caller is resolved from the JWT server-side, which is what makes ownership structural
 * rather than a check somebody forgets -- so a request that grew an `employeeId` would be a security
 * regression that no screen would show.
 */
describe('getLoans', () => {
  beforeEach(() => vi.clearAllMocks())

  it("asks for the caller's own applications and unwraps the envelope", async () => {
    client.get.mockResolvedValue({
      data: { data: [{ id: 'f1c0…', reference: 'PFL/2026-27/00184' }] },
    })

    const loans = await me.getLoans()

    expect(client.get).toHaveBeenCalledWith('/loans')
    expect(loans).toEqual([{ id: 'f1c0…', reference: 'PFL/2026-27/00184' }])
  })

  it('names nobody in the request', async () => {
    client.get.mockResolvedValue({ data: { data: [] } })

    await me.getLoans()

    const [path, config] = client.get.mock.calls[0]
    expect(path).toBe('/loans')
    expect(JSON.stringify(config ?? {})).not.toMatch(/employeeId|pfNumber|pernNumber/)
  })
})

describe('createLoan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts the application and unwraps the envelope', async () => {
    client.post.mockResolvedValue({ data: { data: { id: 'abc', reference: 'PFL/2026-27/00184' } } })

    const created = await me.createLoan({ loanTypeCode: '03', appliedAmount: '300000' })

    expect(client.post).toHaveBeenCalledWith('/loans', {
      loanTypeCode: '03',
      appliedAmount: '300000',
    })
    expect(created.id).toBe('abc')
  })

  /**
   * The absences are the security property, not a convention.
   *
   * The caller is resolved from the token; the account the money goes into is copied from the employee
   * master server-side; the trust's own paying bank is chosen by the PF department. A member who could
   * send any of those could apply as somebody else or redirect their own disbursement.
   */
  it('names nobody and no bank account', async () => {
    client.post.mockResolvedValue({ data: { data: {} } })

    await me.createLoan({
      loanTypeCode: '03',
      totalCost: '480000',
      appliedAmount: '300000',
      contactNumber: '9876543210',
      emailId: 'member@example.com',
      property: null,
      repaymentBank: null,
      documents: [],
    })

    const sent = JSON.stringify(client.post.mock.calls[0][1])

    expect(sent).not.toMatch(/employeeId|pfNumber|pernNumber|entityId/)
    expect(sent).not.toMatch(/paymentBankId|paymentModeId/)
    expect(sent).not.toMatch(/employeeBank|accountNumber/)
  })
})

describe('uploadDocument', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the file as multipart under the part name the API reads', async () => {
    client.post.mockResolvedValue({ data: { data: { fileName: 'member_1.pdf', path: '/x/member_1.pdf' } } })

    const file = new File(['x'], 'invitation.pdf', { type: 'application/pdf' })
    const stored = await me.uploadDocument(file)

    const [path, body] = client.post.mock.calls[0]
    expect(path).toBe('/documents/upload')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBe(file)

    // The path comes back from the API and is what the create call references. The API checks it is
    // one it issued, so a path invented here would be refused rather than served.
    expect(stored.path).toBe('/x/member_1.pdf')
  })
})
