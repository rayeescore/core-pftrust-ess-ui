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
])

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Whether this particular call should hit the API. */
function isLive(name) {
  if (MODE === 'true') return false
  if (MODE === 'partial') return LIVE.has(name)
  return true
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
