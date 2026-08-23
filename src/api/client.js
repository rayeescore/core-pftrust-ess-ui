import axios from 'axios'
import keycloak from '@/keycloak/keycloak'

/**
 * The one HTTP client, pointed at the member API.
 *
 * Every path here is under `/api/v1/me`, and none of them takes an identifier for a person -- not
 * employeeId, pfNumber, pernNumber or entityId. That is not a convention this client enforces, it is how
 * the API is built: the caller is resolved from the JWT once, server-side, which is what makes ownership
 * structural rather than a check somebody forgets. If you find yourself wanting to pass an employee id,
 * the endpoint you want does not exist and should not.
 */
const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1/me`,
  // Content-Disposition and x-suggested-filename are already exposed by the API's CORS config, so PDF
  // downloads arrive with their real filenames rather than saving as "undefined".
  withCredentials: true,
})

client.interceptors.request.use(async (config) => {
  try {
    await keycloak.updateToken(30)
  } catch {
    // Let the request go and fail on its own 401 -- the handler below owns that path, and racing it here
    // would show the member two different errors for one expired session.
  }

  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }

  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      // The most common failure this portal will have. It reaches us as a real 401 only because the API
      // echoes the ESS origin on its 401 path (SecurityConfiguration.corsAwareAuthEntryPoint) -- without
      // that entry it would arrive as an opaque CORS error with nothing to catch, and a session timeout
      // would look like the portal being broken.
      window.dispatchEvent(new CustomEvent('ess:session-expired'))
    }

    if (status === 409 && error.response?.data?.message?.includes('not linked')) {
      // A real state, not a bug: the login worked and no PF account is linked to it. Usually a new joiner
      // whose SAP import has not run yet.
      window.dispatchEvent(new CustomEvent('ess:account-not-linked'))
    }

    return Promise.reject(error)
  },
)

export default client
