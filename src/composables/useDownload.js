import { ref } from 'vue'

/**
 * Downloading a PDF the API generates: statements, the loan history, a receipt.
 *
 * Saved through a temporary `<a download>` rather than opened with `window.open`. By the time the
 * request has come back the click's user activation has usually lapsed, and a popup blocker -- Safari's
 * on a phone especially -- may refuse a new tab. A download is not a popup.
 *
 * The API is bearer-only, so a plain link would carry no Authorization header: the file is fetched
 * through the authenticated client and handed over as an object URL.
 */

export const GENERIC_DOWNLOAD_FAILURE =
  'We could not put this document together. Try again, and raise a query from Help if it keeps happening.'

export function saveFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

function readText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

/**
 * The sentence for a failed download.
 *
 * Only a 404 carries one worth showing -- "not published yet", "not paid yet" -- and on a blob request
 * its body arrives as a Blob, so it is read and parsed here. A 5xx carries no message by the API's own
 * configuration, and a 403 means an id that is not the member's, which no screen of theirs produces.
 */
export async function downloadFailure(error) {
  const response = error?.response
  if (response?.status === 404 && response.data instanceof Blob) {
    try {
      const body = JSON.parse(await readText(response.data))
      if (body?.message) return body.message
    } catch {
      // Not JSON: fall through to the generic sentence.
    }
  }
  return GENERIC_DOWNLOAD_FAILURE
}

/** Per-view download state: which download is running, and what the last failure said. */
export function useDownload() {
  const busy = ref(null)
  const failure = ref(null)

  async function download(key, fetch) {
    busy.value = key
    failure.value = null
    try {
      const { blob, filename } = await fetch()
      saveFile(blob, filename)
    } catch (error) {
      failure.value = await downloadFailure(error)
    } finally {
      busy.value = null
    }
  }

  return { busy, failure, download }
}
