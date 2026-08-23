import Keycloak from 'keycloak-js'

/**
 * The member's Keycloak session.
 *
 * Members sign in with their PF number as the username. That binding is created by the API side's
 * member provisioning (`pf/identity` in core-pftrust-service), which sets the username to the employee's
 * PF number lower-cased and grants the MEMBER realm role. Nothing here needs to know that beyond one
 * consequence: the token's `preferred_username` IS the PF number, and it is what `GET /api/v1/me`
 * resolves the caller by. This app never sends an employee identifier of any kind.
 */
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
})

/** Refresh when the token has less than this left, in seconds. */
const REFRESH_MARGIN = 70

export async function initKeycloak() {
  const authenticated = await keycloak.init({
    onLoad: 'login-required',
    // S256 rather than the default. A public client in a browser cannot keep a secret, so PKCE is the
    // only thing standing between an intercepted authorization code and a session.
    pkceMethod: 'S256',
    checkLoginIframe: false,
  })

  if (authenticated) {
    startSilentRefresh()
  }

  return authenticated
}

/**
 * Keeps the access token fresh in the background.
 *
 * The visible half of the token-expiry design. A member filling in a five-step advance application must
 * not lose it to a token that quietly expired while they were reading step 4, so this runs well ahead of
 * expiry. When it finally cannot refresh -- the refresh token itself has expired -- the app shows the
 * re-authentication modal rather than redirecting, so the half-filled form survives.
 */
function startSilentRefresh() {
  setInterval(() => {
    keycloak.updateToken(REFRESH_MARGIN).catch(() => {
      window.dispatchEvent(new CustomEvent('ess:session-expired'))
    })
  }, 30_000)
}

export function logout() {
  return keycloak.logout({ redirectUri: window.location.origin })
}

export default keycloak
