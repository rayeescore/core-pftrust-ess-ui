import client from './client'
import * as fixtures from '@/fixtures/member'

/**
 * The member API, as this app uses it.
 *
 * Every function here maps to one handler under `/api/v1/me`, and none of them takes an identifier for a
 * person. The fixture branch exists because those handlers are not built yet -- see CLAUDE.md -- and is
 * a single flag rather than a mock library so that deleting it is a one-line change per call.
 */
// getIdentity is live against the API. The other three are still fixtures: their handlers are Phase 3.
const useFixtures = import.meta.env.VITE_USE_FIXTURES === 'true'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The identity strip, and the portal's first call.
 *
 * Built and live: GET /api/v1/me. It also doubles as the check on the member's own account -- a caller
 * whose login is not linked to a PF record gets a 409 here, which the shell renders as its own screen
 * rather than as a failure.
 */
export async function getIdentity() {
  if (useFixtures) {
    await delay(200)
    return fixtures.identity
  }
  return (await client.get('')).data.data
}

export async function getBalance() {
  if (useFixtures) {
    await delay(450)
    return fixtures.balance
  }
  return (await client.get('/balance')).data.data
}

export async function getActiveApplications() {
  if (useFixtures) {
    await delay(350)
    return fixtures.applications
  }
  return (await client.get('/applications/active')).data.data
}

export async function getAlerts() {
  if (useFixtures) {
    await delay(250)
    return fixtures.alerts
  }
  return (await client.get('/alerts')).data.data
}
