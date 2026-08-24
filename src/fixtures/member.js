/**
 * The one member the design canvas is drawn around, with the same figures on every artboard.
 *
 * These exist because the API's `/api/v1/me` routes do not yet -- the member controllers are Phase 3 of
 * the ESS plan and only the Keycloak identity binding is built so far. They let the screens be reviewed
 * and the components exercised against realistic data, and they are shaped exactly like the documented
 * response so swapping to the real API is a change of import and nothing else.
 *
 * Sunita Deshmukh: ₹27,80,690 as on 31 July 2026, after a medical advance paid in June and a transfer-in
 * credited in April. Amounts are strings because they are BigDecimal server-side.
 */
// Matches GET /api/v1/me exactly -- that handler now exists, so this fixture is a copy of a real
// response rather than a guess at one. statusLabel and statusTone arrive already translated: the raw
// ContributionStatus symbol never reaches a browser, so every client says the same words.
export const identity = {
  name: 'Sunita Deshmukh',
  pfNumber: '104782',
  pernNumber: '30045512',
  uanNumber: '100234567891',
  unitCode: '1204',
  location: 'Nashik',
  statusLabel: 'Active member',
  statusTone: 'success',
  canApply: true,
}

export const balance = {
  total: '2780690.00',
  asOn: '31-07-2026',
  lastRecoveryDate: '31-07-2026',
  pfBase: '90000.00',
  buckets: {
    member: {
      total: '1185120.00',
      contributed: '836400.00',
      interest: '348720.00',
      nonTaxable: '1102400.00',
      taxable: '82720.00',
    },
    company: {
      total: '1275120.00',
      contributed: '926400.00',
      interest: '348720.00',
      nonTaxable: '1275120.00',
      taxable: null,
    },
    vpf: {
      total: '320450.00',
      contributed: '234000.00',
      interest: '86450.00',
      nonTaxable: '286300.00',
      taxable: '34150.00',
    },
  },
  financialYear: {
    endingYear: 2027,
    creditedSoFar: '98400.00',
    monthsPosted: 4,
    monthsInYear: 12,
    // The rate belongs to the year it was credited for, not the year the member is in. Showing "8.25%"
    // beside "FY 2026-27" without saying which year it applies to is how a member concludes their
    // current year has already been credited.
    rateLastCredited: '8.25',
    rateForYearEnding: 2026,
  },
}

export const applications = [
  {
    id: 'a1',
    kind: 'LOAN',
    title: 'Purchase of residential flat',
    reference: 'PFL/2026-27/00184',
    status: { label: 'Awaiting final approval', tone: 'awaiting-final' },
    note: 'With the second approver since 18 Aug 2026. Two people must approve an advance.',
    amountLabel: 'Approved amount',
    amount: '2780690.00',
    // Two milestones behind them, the third in flight. Four in total because two different people must
    // approve -- ApprovalAccess enforces that the same person cannot do both stages.
    completedSteps: 2,
    steps: [
      { label: 'Submitted', date: '02-08-2026' },
      { label: 'Under review', date: '11-08-2026' },
      { label: 'Final approval', since: '18-08-2026' },
      { label: 'Payment' },
    ],
  },
  {
    id: 'a2',
    kind: 'TRANSFER_IN',
    title: 'Transfer in · Bharat Forge Ltd PF Trust',
    reference: 'TI/2026-27/0042',
    status: { label: 'Under review', tone: 'info' },
    note: 'We have written to your previous trust for Annexure K. This normally takes a few months — nothing is needed from you until it arrives.',
    amountLabel: null,
    amount: null,
    completedSteps: 1,
    steps: [
      { label: 'Submitted', date: '14-04-2026' },
      { label: 'Under review', since: '20-04-2026' },
      { label: 'Annexure K received' },
      { label: 'Credited' },
    ],
  },
]

export const alerts = [
  {
    tone: 'warning',
    title: 'Your nominee shares add up to 80%.',
    body: 'The remaining 20% is unassigned. Request a correction so the full amount is covered.',
    actionLabel: 'Request a correction',
    to: '/profile/corrections',
  },
]

export const statements = {
  latestAnnual: { endingYear: 2026, published: true },
}
