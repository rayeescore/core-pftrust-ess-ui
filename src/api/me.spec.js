import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
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

describe('withdrawLoan', () => {
  beforeEach(() => vi.clearAllMocks())

  /**
   * The advance is named by its own entityId and nobody is named at all — the caller comes from the
   * JWT, and `@memberOwnership.ownsLoan` answers 403 for somebody else's id rather than 404.
   */
  it("takes back the caller's own advance and unwraps the updated record", async () => {
    client.put.mockResolvedValue({
      data: { data: { id: 'loan-1', status: { label: 'Cancelled' }, withdrawable: false } },
    })

    const updated = await me.withdrawLoan('loan-1')

    expect(client.put).toHaveBeenCalledWith('/loans/loan-1/withdraw')
    expect(updated).toEqual({ id: 'loan-1', status: { label: 'Cancelled' }, withdrawable: false })
  })

  it('names nobody in the request', async () => {
    client.put.mockResolvedValue({ data: { data: {} } })

    await me.withdrawLoan('loan-1')

    const [path, body] = client.put.mock.calls[0]
    expect(path).toBe('/loans/loan-1/withdraw')
    expect(JSON.stringify(body ?? {})).not.toMatch(/employeeId|pfNumber|pernNumber/)
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

describe('getTicket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches one ticket by id and unwraps the envelope', async () => {
    client.get.mockResolvedValue({ data: { data: { id: 'abc', subject: 'Wrong PF number' } } })

    const ticket = await me.getTicket('abc')

    expect(client.get).toHaveBeenCalledWith('/tickets/abc')
    expect(ticket).toEqual({ id: 'abc', subject: 'Wrong PF number' })
  })
})

describe('getTicketCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches the category list and unwraps the envelope', async () => {
    client.get.mockResolvedValue({
      data: { data: [{ code: 'LOANS', label: 'Loans' }] },
    })

    const categories = await me.getTicketCategories()

    expect(client.get).toHaveBeenCalledWith('/tickets/categories')
    expect(categories).toEqual([{ code: 'LOANS', label: 'Loans' }])
  })
})

describe('createTicket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends a new question as multipart, with the question as a JSON part', async () => {
    client.post.mockResolvedValue({ data: { data: { reference: 'PFT654321' } } })

    await me.createTicket(
      { subject: 'Wrong PF number', details: 'The payslip disagrees.', category: 'EMPLOYEE_DETAILS' },
      null,
    )

    const [path, body] = client.post.mock.calls[0]
    expect(path).toBe('/tickets')
    expect(body).toBeInstanceOf(FormData)
    // The API takes the question as a @RequestPart, so it has to be a JSON blob rather than
    // three form fields -- Spring will not bind a plain string to MemberTicketRequest.
    expect(body.get('question')).toBeInstanceOf(Blob)
    // The MIME type is the binding contract, not a formality -- @RequestPart resolves by content
    // type, and the wrong one is a 415 that a shape-only assertion would never catch.
    expect(body.get('question').type).toBe('application/json')
  })

  it('attaches the file when one is given', async () => {
    client.post.mockResolvedValue({ data: { data: {} } })
    const file = new File(['x'], 'proof.pdf', { type: 'application/pdf' })

    await me.createTicket({ subject: 's', details: 'd', category: 'LOANS' }, file)

    const [, body] = client.post.mock.calls[0]
    expect(body.get('file')).toBe(file)
  })

  it('omits the file part when none is given', async () => {
    client.post.mockResolvedValue({ data: { data: {} } })

    await me.createTicket({ subject: 's', details: 'd', category: 'LOANS' }, null)

    const [, body] = client.post.mock.calls[0]
    expect(body.get('file')).toBeNull()
  })
})

describe('replyToTicket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends a reply with the comment as a plain field', async () => {
    client.post.mockResolvedValue({ data: { data: {} } })

    await me.replyToTicket('abc', 'Here it is', null)

    const [path, body] = client.post.mock.calls[0]
    expect(path).toBe('/tickets/abc/comments')
    expect(body.get('comment')).toBe('Here it is')
  })

  it('attaches the file when one is given', async () => {
    client.post.mockResolvedValue({ data: { data: {} } })
    const file = new File(['x'], 'proof.pdf', { type: 'application/pdf' })

    await me.replyToTicket('abc', null, file)

    const [, body] = client.post.mock.calls[0]
    expect(body.get('file')).toBe(file)
  })

  it('unwraps the returned ticket', async () => {
    client.post.mockResolvedValue({ data: { data: { id: 'abc', closed: false } } })

    const ticket = await me.replyToTicket('abc', 'Here it is', null)

    expect(ticket).toEqual({ id: 'abc', closed: false })
  })
})

describe('closeTicket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('closes by id and unwraps the returned ticket', async () => {
    client.put.mockResolvedValue({ data: { data: { closed: true } } })

    const ticket = await me.closeTicket('abc')

    expect(client.put).toHaveBeenCalledWith('/tickets/abc/close')
    expect(ticket).toEqual({ closed: true })
  })
})

describe('getTicketAttachment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches the attachment as a blob, with the name to save it under', async () => {
    const blob = new Blob(['pdf bytes'], { type: 'application/pdf' })
    client.get.mockResolvedValue({ data: blob, headers: { 'x-suggested-filename': 'cheque.jpg' } })

    const result = await me.getTicketAttachment('c1')

    expect(client.get).toHaveBeenCalledWith('/tickets/comments/c1/attachment', {
      responseType: 'blob',
    })
    expect(result).toEqual({ blob, filename: 'cheque.jpg' })
  })

  it('falls back to a name of its own when the API sends no filename header', async () => {
    client.get.mockResolvedValue({ data: new Blob(['x']), headers: {} })

    expect((await me.getTicketAttachment('c1')).filename).toBe('attachment.pdf')
  })
})

describe('change requests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the request as JSON and the proof as a file, in one multipart body', async () => {
    client.post.mockResolvedValue({ data: { data: { id: 'cr-1' } } })
    const file = new File(['cheque'], 'cheque.pdf', { type: 'application/pdf' })

    await me.createChangeRequest(
      { note: 'the number changed', items: [{ field: 'BANK_IFSC', requestedValue: 'ICIC0002' }] },
      file,
    )

    const [path, body] = client.post.mock.calls[0]
    expect(path).toBe('/change-requests')
    expect(body).toBeInstanceOf(FormData)
    // @RequestPart binds by content type, so the request has to be a JSON blob, not form fields.
    expect(body.get('request')).toBeInstanceOf(Blob)
    expect(body.get('request').type).toBe('application/json')
    expect(body.get('file')).toBe(file)
  })

  it('omits the file part when there is no proof to send', async () => {
    client.post.mockResolvedValue({ data: { data: {} } })

    await me.createChangeRequest({ items: [{ field: 'MOBILE', requestedValue: '98812 47730' }] }, null)

    expect(client.post.mock.calls[0][1].get('file')).toBeNull()
  })

  it('names no member in any change-request path', async () => {
    client.get.mockResolvedValue({ data: { data: [] } })
    client.put.mockResolvedValue({ data: { data: {} } })

    await me.getChangeRequests()
    await me.getChangeRequest('cr-1')
    await me.withdrawChangeRequest('cr-1')

    expect(client.get.mock.calls.map((call) => call[0])).toEqual([
      '/change-requests',
      '/change-requests/cr-1',
    ])
    expect(client.put.mock.calls[0][0]).toBe('/change-requests/cr-1/withdraw')
  })

  it('fetches proof as a blob rather than linking to it', async () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    client.get.mockResolvedValue({ data: blob, headers: {} })

    const result = await me.getChangeRequestAttachment('cr-1')

    expect(client.get).toHaveBeenCalledWith('/change-requests/cr-1/attachment', {
      responseType: 'blob',
    })
    expect(result).toEqual({ blob, filename: 'proof.pdf' })
  })
})

describe('transfer-ins', () => {
  beforeEach(() => vi.clearAllMocks())

  it("lists the caller's own and unwraps the envelope", async () => {
    client.get.mockResolvedValue({ data: { data: [{ id: 't1', reference: '2026000123' }] } })

    const list = await me.getTransferIns()

    expect(client.get).toHaveBeenCalledWith('/transfer-ins')
    expect(list).toEqual([{ id: 't1', reference: '2026000123' }])
  })

  it('reads one by id', async () => {
    client.get.mockResolvedValue({ data: { data: { id: 't1' } } })

    expect(await me.getTransferIn('t1')).toEqual({ id: 't1' })
    expect(client.get).toHaveBeenCalledWith('/transfer-ins/t1')
  })

  it('posts the request as JSON and names nobody in it', async () => {
    client.post.mockResolvedValue({ data: { data: { id: 't1' } } })
    const request = { employerName: 'Bharat Forge Ltd', previousPfNumber: 'MH/BAN/1', heldBy: 'TRUST' }

    const created = await me.createTransferIn(request)

    expect(client.post).toHaveBeenCalledWith('/transfer-ins', request)
    expect(JSON.stringify(client.post.mock.calls[0])).not.toMatch(/employeeId|pernNumber|"pfNumber"/)
    expect(created.id).toBe('t1')
  })

  it('fetches a document as a blob rather than linking to it', async () => {
    const blob = new Blob(['%PDF'])
    client.get.mockResolvedValue({ data: blob, headers: {} })

    expect(await me.getTransferInDocument('t1', 'annexure-k')).toEqual({
      blob,
      filename: 'annexure-k.pdf',
    })
    expect(client.get).toHaveBeenCalledWith('/transfer-ins/t1/documents/annexure-k', { responseType: 'blob' })
  })
})

describe('claims', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the raisable types', async () => {
    client.get.mockResolvedValue({ data: { data: [{ code: '04', kind: 'PAYOUT' }] } })
    expect(await me.getClaimTypes()).toEqual([{ code: '04', kind: 'PAYOUT' }])
    expect(client.get).toHaveBeenCalledWith('/settlements/types')
  })

  it("lists and reads the caller's own claims", async () => {
    client.get.mockResolvedValue({ data: { data: [] } })
    await me.getClaims()
    expect(client.get).toHaveBeenCalledWith('/settlements')
    client.get.mockResolvedValue({ data: { data: { id: 's1' } } })
    expect(await me.getClaim('s1')).toEqual({ id: 's1' })
    expect(client.get).toHaveBeenCalledWith('/settlements/s1')
  })

  it('posts a claim with no person and no bank account in it', async () => {
    client.post.mockResolvedValue({ data: { data: { id: 's1' } } })
    const request = { typeCode: '04', lastWorkingDay: '2026-08-31', address: { line1: 'Flat 302' } }
    expect((await me.createClaim(request)).id).toBe('s1')
    expect(client.post).toHaveBeenCalledWith('/settlements', request)
    expect(JSON.stringify(client.post.mock.calls[0])).not.toMatch(/employeeId|pernNumber|"pfNumber"|accountNumber|ifsc/i)
  })

  it('fetches an attached document as a blob', async () => {
    const blob = new Blob(['%PDF'])
    client.get.mockResolvedValue({ data: blob, headers: {} })
    expect(await me.getDocumentFile('d1')).toEqual({ blob, filename: 'document.pdf' })
    expect(client.get).toHaveBeenCalledWith('/documents/d1', { responseType: 'blob' })
  })
})

describe('statements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches the index and unwraps the envelope', async () => {
    const index = { annual: [{ year: 2026, publishedOn: '04-09-2026' }], monthly: [], loanHistory: false }
    client.get.mockResolvedValue({ data: { data: index } })

    expect(await me.getStatements()).toEqual(index)
    expect(client.get).toHaveBeenCalledWith('/statements')
  })

  it('downloads a monthly statement by year, with the name the API gave it', async () => {
    const blob = new Blob(['%PDF'])
    client.get.mockResolvedValue({ data: blob, headers: { 'x-suggested-filename': 'monthly_statement_1_2026.pdf' } })

    expect(await me.getMonthlyStatement(2026)).toEqual({ blob, filename: 'monthly_statement_1_2026.pdf' })
    expect(client.get).toHaveBeenCalledWith('/statements/monthly', { params: { year: 2026 }, responseType: 'blob' })
  })

  it('asks for an annual statement by year alone -- never by version', async () => {
    client.get.mockResolvedValue({ data: new Blob(['%PDF']), headers: {} })

    const download = await me.getAnnualStatement(2026)

    expect(client.get).toHaveBeenCalledWith('/statements/annual', { params: { year: 2026 }, responseType: 'blob' })
    expect(download.filename).toBe('annual_statement_2026.pdf')
  })

  it('downloads the loan history and a receipt', async () => {
    client.get.mockResolvedValue({ data: new Blob(['%PDF']), headers: {} })

    await me.getLoanHistory()
    expect(client.get).toHaveBeenCalledWith('/loans/history', { responseType: 'blob' })

    await me.getLoanReceipt('l1')
    expect(client.get).toHaveBeenCalledWith('/loans/l1/receipt', { responseType: 'blob' })
  })
})
