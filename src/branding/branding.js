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
 * The tab as index.html leaves it, captured before anything overwrites it.
 *
 * Read rather than repeated, so the built-in default IS what the file says and the two cannot drift.
 * index.html keeps its <title> for exactly this reason.
 *
 * Module scope is safe: main.js imports this module, and main.js runs after the document is parsed.
 */
const DEFAULT_TITLE = window.document.title

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
 * Paints the tenant's ESS palette onto :root.
 *
 * Eleven properties and nothing else. This works because Tailwind 4's @theme compiles to real custom
 * properties on :root and every utility reads them through var() -- `bg-brand-500` is
 * `background-color: var(--color-brand-500)` in the built stylesheet -- so an inline property on the
 * document element retints every utility, every arbitrary `style="color: var(--color-brand-700)"` and
 * every component at once, with no rebuild.
 *
 * NEVER CHANGE @theme TO @theme inline. That bakes the value into each utility and silently ends this.
 *
 * Each value is set only if the server sent it: a tenant with a logo and no colour leaves theme.css's
 * palette exactly where it is, rather than having it cleared to nothing.
 */
function applyPalette() {
  const ess = branding.ess

  if (!ess) {
    return
  }

  const root = window.document.documentElement
  const ramp = ess.brand || {}

  RAMP_STOPS.forEach((stop) => {
    if (ramp[stop]) {
      root.style.setProperty(`--color-brand-${stop}`, ramp[stop])
    }
  })

  // The three stacked-bar weights, in the order the server sends them: bucket-1 is the brand itself.
  // .slice(0, 3) is the eleven-properties contract above, not defensive padding: a longer array must
  // never write a --color-bucket-4.
  ;(ess.buckets || []).slice(0, 3).forEach((value, index) => {
    if (value) {
      root.style.setProperty(`--color-bucket-${index + 1}`, value)
    }
  })

  if (ess.actionFill) {
    root.style.setProperty('--color-action-fill', ess.actionFill)
  }

  if (ess.onBrand) {
    root.style.setProperty('--color-on-brand', ess.onBrand)
  }
}

/**
 * The tab: its title and its icon.
 *
 * The title falls back to index.html's; the icon has nothing to fall back to, because this portal ships
 * no icon asset and its tab is blank today. So an absent favicon leaves the tab exactly as it was rather
 * than pointing it at a URL that would 404.
 */
function applyChrome() {
  window.document.title = branding.essPortalName || DEFAULT_TITLE

  const url = assetUrl(branding.favicon)

  if (!url) {
    return
  }

  let link = window.document.querySelector("link[rel='icon']")

  if (!link) {
    link = window.document.createElement('link')
    link.setAttribute('rel', 'icon')
    window.document.head.appendChild(link)
  }

  link.setAttribute('href', url)
}

/**
 * Reads the document.
 *
 * NEVER REJECTS. The portal has to boot when the API is down -- signing in and being told the service is
 * unavailable is a working application; a blank page is not -- so a failure here is a warning and the
 * built-in defaults, not an exception that escapes into the bootstrap.
 *
 * The timeout is a deliberate new value for this call, not an existing convention -- it is here because
 * main.js awaits this before app.mount(): a refused connection rejects at once, but a hung one (upstream
 * alive, not answering) would otherwise hold the portal on a blank page indefinitely.
 */
export async function load() {
  try {
    const response = await axios.get(`${API_ORIGIN}/api/v1/branding`, { timeout: 5000 })
    const { data } = response

    // A string (nginx's SPA rewrite handing back index.html because VITE_API_BASE_URL is empty or
    // points at the portal's own origin) or an array -- typeof 'object', but just as wrong here -- would
    // otherwise spread into numeric keys that every accessor quietly finds nothing on, so the misconfig-
    // uration would look identical to a tenant who configured nothing.
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      console.warn(
        'The branding endpoint answered something other than a document -- check VITE_API_BASE_URL. Using the built-in defaults.',
      )
    } else {
      // Replace rather than merge, so a value cleared on the server is cleared here too -- true of this
      // object; :root is not merge-replaced the same way (see applyPalette), so a colour cleared on the
      // server would stay painted until reload.
      Object.keys(branding).forEach((key) => delete branding[key])
      Object.assign(branding, data)
    }
  } catch (error) {
    console.warn('The branding document could not be read; using the built-in defaults.', error)
  }

  // Its own try/catch, not folded into the one above: NEVER REJECTS has to hold even when the fetch
  // succeeded and applying it is what threw, and a shared catch would blame the wrong step.
  try {
    applyPalette()
  } catch (error) {
    console.warn('The tenant palette could not be applied; using the built-in one.', error)
  }

  try {
    applyChrome()
  } catch (error) {
    console.warn("The tab's title or icon could not be applied; using the built-in ones.", error)
  }
}
