/**
 * The formatting rules every screen shares. Getting any of these wrong is visible to the member.
 */

// en-IN gives the Indian grouping -- last three digits, then twos: 27,80,690, not 2,780,690.
const RUPEES = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const RUPEES_WHOLE = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * A rupee amount, or an em dash when there is not one yet.
 *
 * The distinction is the point. `null` means "not computed yet" -- an interest figure before year end, a
 * settlement estimate before the worksheet exists -- and rendering that as ₹0 tells the member something
 * false about their own money. A zero is a fact; a dash is a wait.
 *
 * Amounts are BigDecimal server-side and arrive as strings so no precision is lost passing through
 * JavaScript's doubles. Never do arithmetic on them here.
 */
export function money(amount, { decimals = false } = {}) {
  if (amount === null || amount === undefined || amount === '') {
    return '—'
  }

  const value = typeof amount === 'string' ? Number(amount) : amount

  if (Number.isNaN(value)) {
    return '—'
  }

  return (decimals ? RUPEES : RUPEES_WHOLE).format(value)
}

export function hasAmount(amount) {
  return amount !== null && amount !== undefined && amount !== '' && !Number.isNaN(Number(amount))
}

/**
 * A date for display: DD MMM YYYY.
 *
 * The API returns dd-MM-yyyy (and dd-MM-yyyy hh:mm for audit stamps) in Asia/Kolkata, which the whole
 * server is pinned to. Parsed by hand rather than through Date(), which reads "08-11-2026" as 8 November
 * in some engines and 11 August in others -- a difference nobody notices until a member reads the wrong
 * date on their own statement.
 */
export function displayDate(value) {
  if (!value) {
    return '—'
  }

  const [datePart] = String(value).split(' ')
  const [day, month, year] = datePart.split('-')

  if (!day || !month || !year) {
    return String(value)
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return `${day} ${months[Number(month) - 1] ?? month} ${year}`
}

/**
 * A financial year, always as a range and never as a bare number.
 *
 * A financial year is named by the calendar year it ENDS in, so April 2025 belongs to FY 2026. Showing
 * that as "2026" invites a member to read it as the year that has not started yet; "FY 2025-26" cannot
 * be misread. This is the convention that keeps being got wrong -- see the API's
 * docs/CONTRIBUTION_AUDIT_FINDINGS.md.
 */
export function financialYear(endingYear) {
  if (!endingYear) {
    return '—'
  }

  const end = Number(endingYear)

  return `FY ${end - 1}–${String(end).slice(-2)}`
}

/** Masks all but the last four characters: XXXX XXXX 4321. */
export function maskTail(value, visible = 4) {
  if (!value) {
    return 'Not on record'
  }

  const text = String(value)

  if (text.length <= visible) {
    return text
  }

  return `${'•'.repeat(Math.max(text.length - visible, 0))}${text.slice(-visible)}`
}
