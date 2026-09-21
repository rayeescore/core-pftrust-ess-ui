/**
 * The passbook's taxable / non-taxable filter.
 *
 * **The server sends each row three times over, and this file only chooses.** Every row carries its own
 * `taxable` and `nonTaxable` objects using the row's own field names, so filtering is a choice of
 * object rather than a conditional per figure. That shape is deliberate on both sides: a browser that
 * had to halve the figures itself would be a second implementation of Rule 9D, and the one in
 * `PassbookServiceImpl` is the one the downloadable statement is printed from.
 *
 * **The halves are the member's own money and nothing else.** Rule 9D classifies the employee's
 * contribution — their own share and their VPF — and the trust records no such classification for the
 * company's. `newMonthlyStatement.xsl`, the PDF behind the Statement button on this very screen, says
 * the same thing: it doubles the Member and VPF columns into Non Taxable and Taxable and leaves Company
 * single. So a filtered row shows **no company figure at all**, and `taxable + nonTaxable` is the row's
 * total less the company share rather than the total. Folding the company's money into one side to make
 * the arithmetic close would put a classification on money nobody has classified, and would disagree
 * with the PDF a member can download beside it.
 *
 * The absent figure needs no special case downstream: `money(undefined)` is already `'—'`, which is what
 * "not classified" should look like. A zero would be a different and false statement.
 */

/** Everything, the company share included. The default, and the only view a phone offers. */
export const ALL = 'all'

export const TAXABLE = 'taxable'

export const NON_TAXABLE = 'nonTaxable'

/**
 * One row as the chosen view shows it.
 *
 * `pfBase` survives the filter untouched, and that is on purpose: it is the wage the month's
 * contribution was computed on, not money sitting in the account, so it has no halves to choose
 * between. Blanking it would tell a member their PF base is unknown; the figure is the same whichever
 * half they are reading.
 */
export function rowFor(row, view) {
  if (view === ALL || !row) {
    return row
  }

  const half = (view === TAXABLE ? row.taxable : row.nonTaxable) ?? {}

  return {
    ...row,
    member: half.member ?? null,
    vpf: half.vpf ?? null,
    interest: half.interest ?? null,
    total: half.total ?? null,
    amount: half.amount ?? null,
    // Not null-coalesced from the row: the company share is absent from a half by design.
    company: null,
  }
}

/**
 * The five-figure summary as the chosen view shows it.
 *
 * Every term of `opening + contributed + transferred in − withdrawn = balance` carries a split, so the
 * equation still reconciles inside a half — which is why the filtered screen keeps the summary rather
 * than blanking it. Only the company share, absent from all five, sits outside the arithmetic.
 */
export function summaryFor(passbook, view) {
  if (view === ALL || !passbook) {
    return passbook
  }

  const half = (view === TAXABLE ? passbook.taxable : passbook.nonTaxable) ?? {}

  return {
    ...passbook,
    opening: half.opening ?? null,
    contributed: half.contributed ?? null,
    transferredIn: half.transferredIn ?? null,
    withdrawn: half.withdrawn ?? null,
    closing: half.closing ?? null,
    totals: half.totals ?? {},
  }
}

/** Whether a view is one of the two halves, which is when the screen owes the member an explanation. */
export function isHalf(view) {
  return view === TAXABLE || view === NON_TAXABLE
}
