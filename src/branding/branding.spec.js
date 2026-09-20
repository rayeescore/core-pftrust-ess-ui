import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('axios', () => ({ default: { get: vi.fn() } }))

/**
 * A document shaped exactly as BrandingRecord serialises one.
 *
 * The `admin` half is here on purpose: this portal must read straight past it. Its values are hex and
 * this portal's are oklch, so a module that took the wrong half would paint something plausible.
 */
const CONFIGURED = {
  shortName: 'M&M PF Trust',
  portalName: 'Core PFT',
  essPortalName: 'M&M PF Trust — Member portal',
  supportEmail: 'pf.trust@example.com',
  supportPhone: '+91 22 0000 0000',
  admin: {
    brand: { 50: '#fdeef0', 100: '#f9c9cf', 500: '#d90f2d', 600: '#b60d26', 700: '#8f0a1e' },
    actionFill: '#d90f2d',
    onBrand: '#ffffff',
  },
  ess: {
    brand: {
      50: 'oklch(0.968 0.019 23.56)',
      100: 'oklch(0.925 0.048 23.56)',
      500: 'oklch(0.562 0.222 23.56)',
      600: 'oklch(0.497 0.199 23.56)',
      700: 'oklch(0.426 0.166 23.56)',
    },
    buckets: ['oklch(0.562 0.222 23.56)', 'oklch(0.700 0.139 23.56)', 'oklch(0.850 0.069 23.56)'],
    actionFill: 'oklch(0.562 0.222 23.56)',
    onBrand: '#ffffff',
    logo: { url: '/api/v1/branding/asset/ESS_LOGO?v=91cd', checksum: '91cd' },
  },
  favicon: { url: '/api/v1/branding/asset/FAVICON?v=7b40', checksum: '7b40' },
  version: 'c41e',
}

/** A fresh copy of the module, loaded with `data`. */
async function boot(data) {
  const axios = (await import('axios')).default
  axios.get.mockResolvedValue({ data })

  const module = await import('@/branding/branding')
  await module.load()

  return { ...module, axios }
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  document.title = 'CorePF Trust — Member portal'
  document.documentElement.removeAttribute('style')
  document.querySelector("link[rel='icon']")?.remove()
})

describe('load', () => {
  it('reads the public document, unwrapped, from the API origin', async () => {
    const { branding, axios } = await boot(CONFIGURED)

    expect(axios.get).toHaveBeenCalledWith('http://api.test/api/v1/branding', { timeout: 5000 })
    expect(branding.shortName).toBe('M&M PF Trust')
    expect(branding.ess.actionFill).toBe('oklch(0.562 0.222 23.56)')
  })

  it('sends no token and asks for nothing under /me', async () => {
    const { axios } = await boot(CONFIGURED)

    const [url, config] = axios.get.mock.calls[0]
    expect(url).not.toMatch(/\/me/)
    expect(JSON.stringify(config)).not.toMatch(/authorization/i)
  })

  it('never rejects when the endpoint is unreachable, and changes nothing', async () => {
    const axios = (await import('axios')).default
    axios.get.mockRejectedValue(new Error('ECONNREFUSED'))
    const module = await import('@/branding/branding')

    await expect(module.load()).resolves.toBeUndefined()

    expect(module.shortName()).toBe('CorePF Trust')
    expect(document.title).toBe('CorePF Trust — Member portal')
    expect(document.documentElement.getAttribute('style')).toBeNull()
  })

  /**
   * What nginx's `try_files $uri $uri/ /index.html` answers when VITE_API_BASE_URL is empty or points
   * at the portal's own origin: a 200 whose body is index.html, not the branding document. Without a
   * shape guard, Object.assign spreads the string's characters into numeric keys, every accessor finds
   * nothing and quietly falls back, and the misconfiguration looks identical to an unconfigured tenant.
   */
  it('warns and leaves the document empty when the endpoint answers something other than a document', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { branding, shortName, essLogoUrl } = await boot('<!doctype html><html></html>')

    expect(branding).toEqual({})
    expect(shortName()).toBe('CorePF Trust')
    expect(essLogoUrl()).toBeNull()
    expect(document.documentElement.getAttribute('style')).toBeNull()
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })
})

describe('the accessors', () => {
  it('makes an asset path absolute and answers null for an absent one', async () => {
    const { assetUrl, essLogoUrl } = await boot(CONFIGURED)

    expect(assetUrl({ url: '/api/v1/branding/asset/ESS_LOGO?v=91cd' })).toBe(
      'http://api.test/api/v1/branding/asset/ESS_LOGO?v=91cd',
    )
    expect(assetUrl(null)).toBeNull()
    expect(essLogoUrl()).toBe('http://api.test/api/v1/branding/asset/ESS_LOGO?v=91cd')
  })

  it('answers null for a logo and contacts the tenant has not set', async () => {
    const { essLogoUrl, supportEmail, supportPhone, shortName } = await boot({ version: 'c41e' })

    expect(essLogoUrl()).toBeNull()
    expect(supportEmail()).toBeNull()
    expect(supportPhone()).toBeNull()
    expect(shortName()).toBe('CorePF Trust')
  })

  it('answers the configured contacts', async () => {
    const { supportEmail, supportPhone } = await boot(CONFIGURED)

    expect(supportEmail()).toBe('pf.trust@example.com')
    expect(supportPhone()).toBe('+91 22 0000 0000')
  })
})

describe('the palette', () => {
  it('paints the ESS ramp, the buckets and the action pair onto the document element', async () => {
    await boot(CONFIGURED)
    const style = document.documentElement.style

    expect(style.getPropertyValue('--color-brand-50')).toBe('oklch(0.968 0.019 23.56)')
    expect(style.getPropertyValue('--color-brand-500')).toBe('oklch(0.562 0.222 23.56)')
    expect(style.getPropertyValue('--color-brand-700')).toBe('oklch(0.426 0.166 23.56)')
    expect(style.getPropertyValue('--color-bucket-1')).toBe('oklch(0.562 0.222 23.56)')
    expect(style.getPropertyValue('--color-bucket-3')).toBe('oklch(0.850 0.069 23.56)')
    expect(style.getPropertyValue('--color-action-fill')).toBe('oklch(0.562 0.222 23.56)')
    expect(style.getPropertyValue('--color-on-brand')).toBe('#ffffff')
  })

  /**
   * The admin half is hex and this portal's palette is oklch. Reading the wrong half would produce a
   * portal that looked almost right, which is worse than one that looked wrong.
   */
  it('never paints the admin half, whose values are hex', async () => {
    await boot({ admin: CONFIGURED.admin, version: 'c41e' })

    expect(document.documentElement.getAttribute('style')).toBeNull()
  })

  it('leaves theme.css alone for a tenant that has configured nothing', async () => {
    await boot({ version: 'c41e' })

    expect(document.documentElement.getAttribute('style')).toBeNull()
  })

  /** A present-but-partial `ess`: the tenant uploaded a logo and never picked a colour. */
  it('sets no colour for a tenant that uploaded a logo and set no colour', async () => {
    await boot({ ess: { logo: CONFIGURED.ess.logo }, version: 'c41e' })

    expect(document.documentElement.getAttribute('style')).toBeNull()
  })
})

describe('the tab', () => {
  it('takes its title from essPortalName', async () => {
    await boot(CONFIGURED)

    expect(document.title).toBe('M&M PF Trust — Member portal')
  })

  it("keeps index.html's title when the tenant has not named the portal", async () => {
    await boot({ shortName: 'M&M PF Trust', version: 'c41e' })

    expect(document.title).toBe('CorePF Trust — Member portal')
  })

  it('points a created icon link at the tenant favicon', async () => {
    await boot(CONFIGURED)

    expect(document.querySelector("link[rel='icon']").getAttribute('href')).toBe(
      'http://api.test/api/v1/branding/asset/FAVICON?v=7b40',
    )
  })

  /** index.html ships no icon link and this repo has no icon asset, so there is nothing to fall back to. */
  it('adds no icon link when the tenant has no favicon', async () => {
    await boot({ version: 'c41e' })

    expect(document.querySelector("link[rel='icon']")).toBeNull()
  })
})
