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

/** Handlers that exist in core-pftrust-service today. */
const LIVE = new Set(['identity'])

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
