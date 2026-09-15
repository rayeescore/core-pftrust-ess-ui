import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GENERIC_DOWNLOAD_FAILURE, downloadFailure, saveFile, useDownload } from '@/composables/useDownload'

/**
 * Downloading a generated PDF. Two behaviours matter: the file is saved rather than opened in a tab a
 * popup blocker may refuse, and a 404 says the API's sentence even though a blob request's error body is
 * a Blob, not JSON.
 */
describe('useDownload', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:fixture')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => vi.restoreAllMocks())

  it('saves the blob under its filename through a temporary link', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    saveFile(new Blob(['%PDF']), 'loan_history_1.pdf')

    expect(click).toHaveBeenCalledOnce()
    expect(click.mock.contexts[0].download).toBe('loan_history_1.pdf')
    expect(document.querySelector('a[download]')).toBeNull()
  })

  it("reads a 404's sentence out of a blob error body", async () => {
    const body = new Blob([JSON.stringify({ message: 'A receipt is issued once the advance has been paid.' })])

    expect(await downloadFailure({ response: { status: 404, data: body } })).toBe(
      'A receipt is issued once the advance has been paid.',
    )
  })

  it('says the generic sentence for anything else', async () => {
    expect(await downloadFailure({ response: { status: 500, data: new Blob(['']) } })).toBe(GENERIC_DOWNLOAD_FAILURE)
    expect(await downloadFailure(new Error('network'))).toBe(GENERIC_DOWNLOAD_FAILURE)
  })

  it('marks one download busy at a time and records a failure', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { busy, failure, download } = useDownload()

    await download('annual-2026', async () => {
      expect(busy.value).toBe('annual-2026')
      return { blob: new Blob(['%PDF']), filename: 'a.pdf' }
    })
    expect(busy.value).toBeNull()
    expect(failure.value).toBeNull()

    await download('monthly-2019', async () => {
      throw { response: { status: 404, data: new Blob([JSON.stringify({ message: 'No statement.' })]) } }
    })
    expect(failure.value).toBe('No statement.')
    expect(busy.value).toBeNull()
  })
})
