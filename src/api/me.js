import client from './client'
import * as fixtures from '@/fixtures/member'

/**
 * The member API, as this app uses it.
 *
 * Every function maps to one handler under `/api/v1/me`, and none takes an identifier for a person. The
 * caller is resolved from the JWT once, server-side, which is what makes ownership structural rather
 * than a check somebody forgets. If a call seems to need an employee id, the endpoint you want does not
 * exist and should not.
 *
 * VITE_USE_FIXTURES has three settings, because the project is genuinely in three states at once:
 *
 *   'false'    every call is live. Honest, and today it leaves most of the dashboard empty.
 *   'true'     no API and no sign-in. For looking at screens; never for a deployment.
 *   'partial'  live where the handler exists, fixtures where it does not. Real Keycloak sign-in and a
 *              complete dashboard, which is the useful state while Phase 3 is being built.
 *
 * `LIVE` below is the list of what is actually built. It is the thing to edit as handlers land, and
 * when it covers everything the flag and this module's branching both go away.
 */
const MODE = import.meta.env.VITE_USE_FIXTURES ?? 'false'

/**
 * Handlers that exist in core-pftrust-service today.
 *
 * All of them, as of the member API being built. The flag and the branching below are now dead weight
 * kept for one reason: a screen whose handler is still being changed can be pulled back to a fixture by
 * removing one line, without touching the component.
 */
const LIVE = new Set([
  'identity',
  'profile',
  'balance',
  'passbook',
  'contributedYears',
  'applications',
  'alerts',
  'loanTypes',
  'loanEligibility',
  'loanDocuments',
  'loans',
  'loan',
  'tickets',
  'trust',
  'createLoan',
  'uploadDocument',
  'ticket',
  'ticketCategories',
  'createTicket',
  'replyToTicket',
  'closeTicket',
  'ticketAttachment',
  'changeRequests',
  'changeRequest',
  'createChangeRequest',
  'withdrawChangeRequest',
  'changeRequestAttachment',
  'transferIns',
  'transferIn',
  'createTransferIn',
  'transferInDocument',
  'claimTypes',
  'claims',
  'claim',
  'createClaim',
  'documentFile',
  'statements',
  'monthlyStatement',
  'annualStatement',
  'loanHistory',
  'loanReceipt',
])

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Whether this particular call should hit the API. */
function isLive(name) {
  if (MODE === 'true') return false
  if (MODE === 'partial') return LIVE.has(name)
  return true
}

/**
 * A generated PDF: the file and the name the API gave it. X-Suggested-Filename is exposed by the API's
 * CORS configuration; the fallback covers fixture mode and a proxy that strips the header.
 */
function asDownload(response, fallback) {
  return { blob: response.data, filename: response.headers?.['x-suggested-filename'] ?? fallback }
}

function fixtureDownload(filename) {
  return { blob: new Blob(['fixture'], { type: 'application/pdf' }), filename }
}

/**
 * The identity strip, and the portal's first call. Built and live: GET /api/v1/me.
 *
 * It doubles as the check on the member's own account -- a caller whose login is not linked to a PF
 * record gets a 409 here, which the shell renders as its own screen rather than as a failure.
 */
export async function getIdentity() {
  if (!isLive('identity')) {
    await delay(200)
    return fixtures.identity
  }
  return (await client.get('')).data.data
}

/** Phase 3. Needs a balance aggregate on the service side -- today balances only exist inside PDFs. */
export async function getBalance() {
  if (!isLive('balance')) {
    await delay(450)
    return fixtures.balance
  }
  return (await client.get('/balance')).data.data
}

/** Phase 3. */
export async function getActiveApplications() {
  if (!isLive('applications')) {
    await delay(350)
    return fixtures.applications
  }
  return (await client.get('/applications/active')).data.data
}

/** Phase 3. */
export async function getAlerts() {
  if (!isLive('alerts')) {
    await delay(250)
    return fixtures.alerts
  }
  return (await client.get('/alerts')).data.data
}

/** Phase 3. Month 0 is the opening balance; events sit inline between the months. */
export async function getPassbook(year) {
  if (!isLive('passbook')) {
    await delay(350)
    return fixtures.passbook
  }
  return (await client.get('/contributions', { params: { year } })).data.data
}

/** Phase 3. The years a statement exists for, so the picker never offers an empty one. */
export async function getContributedYears() {
  if (!isLive('contributedYears')) {
    await delay(150)
    return fixtures.contributedYears
  }
  return (await client.get('/contributions/years')).data.data
}

/** Phase 3. Carries structured eligibility reasons rather than the exception strings thrown today. */
export async function getLoanTypes() {
  if (!isLive('loanTypes')) {
    await delay(300)
    return fixtures.loanTypes
  }
  return (await client.get('/loans/types')).data.data
}

/** Phase 3. The four limits and which one bound -- see EntitlementCard. */
export async function checkLoanEligibility(request) {
  if (!isLive('loanEligibility')) {
    await delay(250)
    return fixtures.entitlement
  }
  return (await client.post('/loans/eligibility', request)).data.data
}

/** Phase 3. Empty for eleven of the twelve purposes until loan_document_mapping is populated. */
export async function getLoanDocuments(code) {
  if (!isLive('loanDocuments')) {
    await delay(250)
    return code === '01' ? fixtures.loanDocuments : []
  }
  return (await client.get(`/loans/types/${code}/documents`)).data.data
}

/**
 * Every advance the caller has applied for, newest first.
 *
 * No identifier goes out. The list is "mine" by construction, which is what makes there be no such
 * thing as somebody else's list to ask for.
 */
export async function getLoans() {
  if (!isLive('loans')) {
    await delay(300)
    return [fixtures.loan]
  }
  return (await client.get('/loans')).data.data
}

/** Phase 3. */
export async function getLoan(id) {
  if (!isLive('loan')) {
    await delay(300)
    return fixtures.loan
  }
  return (await client.get(`/loans/${id}`)).data.data
}

/** Phase 3. Masked server-side: the member record never carries a full PAN or Aadhaar. */
export async function getProfile() {
  if (!isLive('profile')) {
    await delay(300)
    return fixtures.profile
  }
  return (await client.get('/profile')).data.data
}

/** Phase 3. Own tickets only -- and closing has to be scoped to the owner, which it is not today. */
export async function getTickets() {
  if (!isLive('tickets')) {
    await delay(300)
    return fixtures.tickets
  }
  return (await client.get('/tickets')).data.data
}

/**
 * One question, with its whole thread.
 *
 * Addressed by `id`, which the record only started carrying when the write surface was built -- a list
 * of questions is a dead end without it. A foreign id is a 403 rather than a 404: the API refuses the
 * request instead of confirming the id exists.
 */
export async function getTicket(id) {
  if (!isLive('ticket')) {
    await delay(300)
    return fixtures.tickets[0]
  }
  return (await client.get(`/tickets/${id}`)).data.data
}

/**
 * What a question can be about.
 *
 * Fetched rather than hard-coded here, so the picker and the thread cannot disagree about what
 * EMPLOYEE_DETAILS is called. Returns [{ code, label }].
 */
export async function getTicketCategories() {
  if (!isLive('ticketCategories')) {
    await delay(200)
    return [
      { code: 'EMPLOYEE_DETAILS', label: 'Your details' },
      { code: 'CONTRIBUTIONS', label: 'Contributions' },
      { code: 'LOANS', label: 'Loans' },
      { code: 'TRANSFER_INS', label: 'Transfer ins' },
      { code: 'SETTLEMENTS', label: 'Settlements' },
    ]
  }
  return (await client.get('/tickets/categories')).data.data
}

/**
 * Ask the PF department something, with an optional page of proof.
 *
 * Multipart, and the question itself goes as a JSON Blob rather than three form fields: the API takes
 * it as a @RequestPart bound to MemberTicketRequest, and Spring will not bind a plain string to that.
 */
export async function createTicket(question, file) {
  if (!isLive('createTicket')) {
    await delay(700)
    return fixtures.tickets[0]
  }

  const body = new FormData()
  body.append('question', new Blob([JSON.stringify(question)], { type: 'application/json' }))

  if (file) {
    body.append('file', file)
  }

  return (await client.post('/tickets', body)).data.data
}

/** A reply, which may be words, a page, or both -- but not neither. */
export async function replyToTicket(id, comment, file) {
  if (!isLive('replyToTicket')) {
    await delay(500)
    return fixtures.tickets[0]
  }

  const body = new FormData()

  if (comment) {
    body.append('comment', comment)
  }

  if (file) {
    body.append('file', file)
  }

  return (await client.post(`/tickets/${id}/comments`, body)).data.data
}

/** "This is settled." The member's own judgement, and only on their own question. */
export async function closeTicket(id) {
  if (!isLive('closeTicket')) {
    await delay(400)
    return { ...fixtures.tickets[0], closed: true }
  }
  return (await client.put(`/tickets/${id}/close`)).data.data
}

/**
 * One page attached to a message, fetched rather than linked.
 *
 * A plain <a href> would be a top-level navigation, which carries no Authorization header -- and this
 * API is bearer-only with no cookie session, so the browser would land on a 401 and a blank tab. So
 * the file comes back through the same authenticated client as everything else, and the caller turns
 * it into an object URL.
 */
export async function getTicketAttachment(attachmentId) {
  if (!isLive('ticketAttachment')) {
    await delay(300)
    return fixtureDownload('attachment.pdf')
  }
  return asDownload(
    await client.get(`/tickets/comments/${attachmentId}/attachment`, { responseType: 'blob' }),
    'attachment.pdf',
  )
}

/**
 * Who holds the member's money, in the part a member is entitled to know.
 *
 * The only member call that is not about the caller -- the trust is the same trust for everybody, so
 * there is nothing to resolve from the token. It is still behind MEMBER: an unauthenticated reader has
 * no business enumerating the trustees.
 *
 * The record deliberately drops the trust's own bank account, IFSC, PAN and TAN, which the staff entity
 * carries. Returning that shape would publish the trust's bank account to every member at once.
 */
export async function getTrust() {
  if (!isLive('trust')) {
    await delay(250)
    return fixtures.trust
  }
  return (await client.get('/trust')).data.data
}

/**
 * Submit the advance.
 *
 * Nothing in the request names a person, and nothing in it names the trust's paying bank or the
 * member's own account either -- the first is chosen by the PF department, the second is copied from
 * the employee master server-side. A member who could type an account number on an advance could
 * redirect their own disbursement.
 *
 * The entitlement is recomputed server-side. Asking for more than it is allowed and is recorded as
 * what you asked for; what you get is what the trust works out.
 */
export async function createLoan(request) {
  if (!isLive('createLoan')) {
    await delay(700)
    return fixtures.loan
  }
  return (await client.post('/loans', request)).data.data
}

/**
 * One file, up to 5 MB, PDF or photograph.
 *
 * Returns { fileName, path }. The path is what the create call sends back -- and the API checks it is
 * one it issued before anything reads it, so a path invented here would be refused rather than served.
 */
export async function uploadDocument(file) {
  if (!isLive('uploadDocument')) {
    await delay(600)
    return { fileName: file.name, path: `fixture/${file.name}` }
  }
  const body = new FormData()
  body.append('file', file)
  return (await client.post('/documents/upload', body)).data.data
}

/**
 * Corrections this member has asked for.
 *
 * Their details come from payroll and there is no endpoint that edits one -- so "update my details" is
 * a request the PF department reviews, not a form that saves. This is the list of those requests.
 */
export async function getChangeRequests() {
  if (!isLive('changeRequests')) {
    await delay(300)
    return fixtures.changeRequests ?? []
  }
  return (await client.get('/change-requests')).data.data
}

/** One request, with its before-and-after diff. */
export async function getChangeRequest(id) {
  if (!isLive('changeRequest')) {
    await delay(250)
    return (fixtures.changeRequests ?? [])[0] ?? null
  }
  return (await client.get(`/change-requests/${id}`)).data.data
}

/**
 * Ask for a correction.
 *
 * Multipart, because a nominee or bank change has to come with proof -- the server refuses one without
 * it and says which document it wants, so this does not duplicate that rule, it just carries the file.
 */
export async function createChangeRequest(request, file) {
  if (!isLive('createChangeRequest')) {
    await delay(700)
    return { id: 'fixture', status: { label: 'Under review', tone: 'info' } }
  }

  const body = new FormData()
  body.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))

  if (file) {
    body.append('file', file)
  }

  return (await client.post('/change-requests', body)).data.data
}

/** Take a request back before the department has answered it. */
export async function withdrawChangeRequest(id) {
  if (!isLive('withdrawChangeRequest')) {
    await delay(400)
    return { id, status: { label: 'Withdrawn', tone: 'muted' } }
  }
  return (await client.put(`/change-requests/${id}/withdraw`)).data.data
}

/**
 * The proof the member attached, so they can check they sent the right page.
 *
 * A blob rather than a link, for the same reason as a ticket attachment: this API is bearer-only with
 * no cookie session, so an <a href> would be a top-level navigation with no Authorization header and
 * would land the member on a 401 in a blank tab.
 */
export async function getChangeRequestAttachment(id) {
  if (!isLive('changeRequestAttachment')) {
    await delay(300)
    return fixtureDownload('proof.pdf')
  }
  return asDownload(await client.get(`/change-requests/${id}/attachment`, { responseType: 'blob' }), 'proof.pdf')
}

/**
 * The member's transfer-ins, imported ones included, newest first.
 *
 * Each arrives with its status already in words and its three steps -- submitted, accepted, credited --
 * because a transfer-in is not a loan and must not be drawn as one.
 */
export async function getTransferIns() {
  if (!isLive('transferIns')) {
    await delay(300)
    return [fixtures.transferIn]
  }
  return (await client.get('/transfer-ins')).data.data
}

/** One transfer-in, by its own id. Somebody else's id is a 403. */
export async function getTransferIn(id) {
  if (!isLive('transferIn')) {
    await delay(300)
    return fixtures.transferIn
  }
  return (await client.get(`/transfer-ins/${id}`)).data.data
}

/**
 * Ask for a previous PF account to be brought in.
 *
 * JSON, with any proof already uploaded through uploadDocument and referenced by the path it returned.
 * Nothing here names the member: the API takes them from the login. A second open request for the same
 * previous account is a 409 whose message names the first -- show it as it comes.
 */
export async function createTransferIn(request) {
  if (!isLive('createTransferIn')) {
    await delay(700)
    return fixtures.transferIn
  }
  return (await client.post('/transfer-ins', request)).data.data
}

/**
 * Annexure K or the dispatch letter, as a blob. A blob rather than a link for the same reason as a ticket
 * attachment: this API is bearer-only, and a plain link would arrive with no Authorization header.
 */
export async function getTransferInDocument(id, kind) {
  if (!isLive('transferInDocument')) {
    await delay(300)
    return fixtureDownload(`${kind}.pdf`)
  }
  return asDownload(
    await client.get(`/transfer-ins/${id}/documents/${kind}`, { responseType: 'blob' }),
    `${kind}.pdf`,
  )
}

/** The kinds of claim a member can raise, each with the documents the trust asks for. */
export async function getClaimTypes() {
  if (!isLive('claimTypes')) {
    await delay(250)
    return fixtures.claimTypes
  }
  return (await client.get('/settlements/types')).data.data
}

/** The member's own claims, newest first. */
export async function getClaims() {
  if (!isLive('claims')) {
    await delay(300)
    return []
  }
  return (await client.get('/settlements')).data.data
}

/** One claim, by its own id. Somebody else's id is a 403. */
export async function getClaim(id) {
  if (!isLive('claim')) {
    await delay(300)
    return fixtures.claim
  }
  return (await client.get(`/settlements/${id}`)).data.data
}

/**
 * Raise a payout or transfer-out claim.
 *
 * No bank account and no PAN in it: both are copied from the record server-side, so a claim cannot be
 * sent to an account typed here. A second open claim is a 409 whose message names the first.
 */
export async function createClaim(request) {
  if (!isLive('createClaim')) {
    await delay(700)
    return fixtures.claim
  }
  return (await client.post('/settlements', request)).data.data
}

/** A document the member attached, as a blob — this API is bearer-only, so a plain link would 401. */
export async function getDocumentFile(id) {
  if (!isLive('documentFile')) {
    await delay(300)
    return fixtureDownload('document.pdf')
  }
  return asDownload(await client.get(`/documents/${id}`, { responseType: 'blob' }), 'document.pdf')
}

/** What the member can download: published annual statements, contributed years, the loan history. */
export async function getStatements() {
  if (!isLive('statements')) {
    await delay(250)
    return fixtures.statements
  }
  return (await client.get('/statements')).data.data
}

/** The monthly statement for a financial year the member contributed in. */
export async function getMonthlyStatement(year) {
  const fallback = `monthly_statement_${year}.pdf`
  if (!isLive('monthlyStatement')) {
    await delay(300)
    return fixtureDownload(fallback)
  }
  return asDownload(await client.get('/statements/monthly', { params: { year }, responseType: 'blob' }), fallback)
}

/** The published annual statement for a financial year. By year alone: the server picks the version. */
export async function getAnnualStatement(year) {
  const fallback = `annual_statement_${year}.pdf`
  if (!isLive('annualStatement')) {
    await delay(300)
    return fixtureDownload(fallback)
  }
  return asDownload(await client.get('/statements/annual', { params: { year }, responseType: 'blob' }), fallback)
}

/** Every paid advance, as the trust's loan history sheet. */
export async function getLoanHistory() {
  if (!isLive('loanHistory')) {
    await delay(300)
    return fixtureDownload('loan_history.pdf')
  }
  return asDownload(await client.get('/loans/history', { responseType: 'blob' }), 'loan_history.pdf')
}

/** The receipt for one paid advance. Somebody else's id is a 403; an unpaid one a 404. */
export async function getLoanReceipt(id) {
  if (!isLive('loanReceipt')) {
    await delay(300)
    return fixtureDownload('loan_receipt.pdf')
  }
  return asDownload(await client.get(`/loans/${id}/receipt`, { responseType: 'blob' }), 'loan_receipt.pdf')
}
