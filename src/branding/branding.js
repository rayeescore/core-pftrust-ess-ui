import axios from 'axios'
import { reactive } from 'vue'

/**
 * The tenant's appearance, read once at boot from the public branding endpoint.
 *
 * WHY A MODULE RATHER THAN A COMPOSABLE. This runs before the app is mounted -- the palette has to be on
 * :root before the first paint or the portal flashes the built-in red -- so there is no component alive
 * to own it. It is then read by the shell, the unlinked screen and the trust page, which is three
 * unrelated places.
 *
 * NO PALETTE ARITHMETIC HAPPENS HERE, and that is the point. The ramp, the buckets, the action fill and
 * the foreground that reads on it are all derived server-side in OKLCH (design document, section 5). A
 * second implementation in JavaScript would drift from the first within a release and the two portals
 * would stop agreeing about what the tenant's colour is. This module only ever paints what it is handed.
 *
 * IT DOES NOT USE src/api/client.js, deliberately. That client prefixes /api/v1/me and its interceptor
 * awaits keycloak.updateToken() before every request. This endpoint is public (design document, section
 * 7.1), is not under /me, and is read before keycloak.init() has produced a token.
 */

/**
 * What this portal looks like for a tenant that has configured nothing.
 *
 * `CorePF Trust` is the literal AppShell.vue carries today. It is not a house style to be tidied -- it
 * is the promise that an empty tenant_configuration table changes nothing on screen.
 */
const DEFAULT_SHORT_NAME = 'CorePF Trust'

/**
 * An AssetRef's `url` is a path -- `/api/v1/branding/asset/ESS_LOGO?v=...` -- because the server does
 * not know which origin it is being reached on. The browser does.
 *
 * There is no axios default baseURL in this app (the one client carries its own), so this is the only
 * thing standing between the module and a request to the PORTAL's origin, which in production would
 * 404 and fall back to the defaults with nothing on screen to say so.
 */
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || ''

/** The ramp stops the server sends, in order. Strings, because that is how the map is keyed. */
export const RAMP_STOPS = ['50', '100', '500', '600', '700']

/**
 * The document as served, with its fields at the top level.
 *
 * Empty until load() resolves -- every reader must cope with an absent field rather than assuming the
 * shape, because the server omits nulls entirely (@JsonInclude(NON_NULL)) and "configured nothing"
 * really does arrive as {version}. A load() that FAILS leaves the previous contents in place: the
 * clear-and-replace below sits inside the try.
 */
export const branding = reactive({})

/** An AssetRef to something an <img> can load. Null when that asset has never been uploaded. */
export function assetUrl(reference) {
  if (!reference?.url) {
    return null
  }

  return API_ORIGIN + reference.url
}

/** The tenant's mark for this portal, or null -- in which case the shell draws its own. */
export function essLogoUrl() {
  return assetUrl(branding.ess?.logo)
}

/** The name in the app bar. The trust's short name, which is also the PDF letterhead's. */
export function shortName() {
  return branding.shortName || DEFAULT_SHORT_NAME
}

/** Where a member writes when they cannot raise a query. Null when the tenant has set none. */
export function supportEmail() {
  return branding.supportEmail || null
}

/** The PF department's telephone number, as the tenant wrote it. Null when unset. */
export function supportPhone() {
  return branding.supportPhone || null
}

/**
 * Reads the document.
 *
 * NEVER REJECTS. The portal has to boot when the API is down -- signing in and being told the service is
 * unavailable is a working application; a blank page is not -- so a failure here is a warning and the
 * built-in defaults, not an exception that escapes into the bootstrap.
 *
 * The timeout is the one in this codebase's axios calls, and it is here because main.js awaits this
 * before app.mount(): a refused connection rejects at once, but a hung one (upstream alive, not
 * answering) would otherwise hold the portal on a blank page indefinitely.
 */
export async function load() {
  try {
    const response = await axios.get(`${API_ORIGIN}/api/v1/branding`, { timeout: 5000 })

    // Replace rather than merge, so a value cleared on the server is cleared here too.
    Object.keys(branding).forEach((key) => delete branding[key])
    Object.assign(branding, response.data || {})
  } catch (error) {
    console.warn('The branding document could not be read; using the built-in defaults.', error)
  }
}
