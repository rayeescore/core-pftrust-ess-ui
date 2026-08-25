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

/**
 * The passbook for FY 2026-27, matching the artboard exactly.
 *
 * Note the shape: `rows` interleaves months with events in the order they happened, because that is
 * what the screen renders. Opening balance is row zero and is typed separately -- it is a balance
 * brought forward, not a thirteenth month.
 */
export const passbook = {
  openingLabel: '01 Apr',
  closingLabel: '31 Jul',
  closingDate: '31-07-2026',
  opening: '2617990.00',
  contributed: '98400.00',
  transferredIn: '184300.00',
  withdrawn: '120000.00',
  closing: '2780690.00',
  lastRate: '8.25',
  unpostedNote:
    'August to March are not posted yet. Payroll sends each month\u2019s contribution after it closes.',
  totals: { member: '1185120.00', company: '1275120.00', vpf: '320450.00' },
  rows: [
    {
      key: 'opening',
      type: 'opening',
      member: '1139770.00',
      company: '1139770.00',
      vpf: '338450.00',
      total: '2617990.00',
      postedOn: '01-04-2026',
    },
    {
      key: 'apr',
      type: 'month',
      month: 'April',
      pfBase: '90000.00',
      member: '10800.00',
      company: '10800.00',
      vpf: '3000.00',
      total: '24600.00',
      postedOn: '30-04-2026',
    },
    {
      key: 'ti',
      type: 'event',
      direction: 'in',
      title: 'Transfer in from Kirloskar Oil Engines PF Trust',
      detail: 'Yours ₹92,150 · Company ₹92,150',
      amount: '184300.00',
      postedOn: '22-04-2026',
    },
    {
      key: 'may',
      type: 'month',
      month: 'May',
      pfBase: '90000.00',
      member: '10800.00',
      company: '10800.00',
      vpf: '3000.00',
      total: '24600.00',
      postedOn: '31-05-2026',
    },
    {
      key: 'jun',
      type: 'month',
      month: 'June',
      pfBase: '90000.00',
      member: '10800.00',
      company: '10800.00',
      vpf: '3000.00',
      total: '24600.00',
      postedOn: '30-06-2026',
    },
    {
      key: 'loan',
      type: 'event',
      direction: 'out',
      title: 'Medical advance paid · PFL/2026-27/00091',
      detail:
        'Yours −₹90,000 · VPF −₹30,000 · the company share is untouched by a medical advance',
      amount: '120000.00',
      postedOn: '30-06-2026',
    },
    {
      key: 'jul',
      type: 'month',
      month: 'July',
      pfBase: '90000.00',
      member: '10800.00',
      company: '10800.00',
      vpf: '3000.00',
      total: '24600.00',
      postedOn: '31-07-2026',
    },
  ],
}

/** The years a statement exists for. The picker never offers one that would come back empty. */
export const contributedYears = [2027, 2026, 2025, 2024]

/**
 * The twelve advance purposes, grouped as the design groups them: by what the money is for, not by the
 * loan_group letter the database uses. A member does not think in groups A to E.
 *
 * Two are closed to Sunita, and both stay on the list with the reason. Hiding them generates queries.
 */
export const loanTypes = [
  {
    name: 'Housing',
    types: [
      {
        code: '01',
        title: 'Purchase of Residential House/Flat',
        basis: 'Up to 36 months of PF base salary, against your whole balance.',
        usage: 'Used 0 of 100 · needs 5 years’ membership',
        eligible: true,
      },
      {
        code: '11',
        title: 'Construction of Residential House/Flat',
        reason: 'You have already taken this advance once, and it is allowed once only.',
        usage: 'Used 1 of 1 · not available',
        eligible: false,
      },
      {
        code: '10',
        title: 'Purchase of Residential House/Flat (Second Sale)',
        basis: 'Up to 36 months of PF base salary, against your whole balance.',
        usage: 'Used 0 of 100',
        eligible: true,
      },
      {
        code: '12',
        title: 'Purchase of Site/Plot',
        basis: 'Up to 24 months of PF base salary, against your whole balance.',
        usage: 'Used 0 of 100',
        eligible: true,
      },
      {
        code: '13',
        title: 'Repayment of Housing Loan',
        basis: 'Up to 36 months of PF base salary, paid to your lender.',
        usage: 'Used 0 of 1 · needs 10 years’ membership',
        eligible: true,
      },
      {
        code: '02',
        title: 'Alteration / Improvement / Additions',
        basis: 'Up to 12 months of PF base salary, from your own and VPF contributions.',
        usage: 'Used 0 of 5',
        eligible: true,
      },
    ],
  },
  {
    name: 'Family',
    types: [
      {
        code: '03',
        title: 'Marriage',
        basis: 'Half of your own and VPF contributions.',
        usage: 'Used 0 of 3 · needs 7 years’ membership',
        eligible: true,
      },
      {
        code: '08',
        title: 'Education (Post-Matriculation) of Children',
        basis: 'All of your own and VPF contributions.',
        usage: 'Used 0 of 3 · needs 7 years’ membership',
        eligible: true,
      },
    ],
  },
  {
    name: 'Medical',
    types: [
      {
        code: '04',
        title: 'Hospitalisation, major operation or sickness',
        basis: 'Half of your own and VPF contributions. No minimum membership.',
        usage: 'Used 1 of 5',
        eligible: true,
      },
    ],
  },
  {
    name: 'Retirement & emergency',
    types: [
      {
        code: '99',
        title: 'Pre-retirement withdrawal',
        reason: 'Available in the year before you retire. You are not there yet.',
        usage: 'Not available',
        eligible: false,
      },
      {
        code: '98',
        title: 'Epidemic or pandemic',
        basis: 'Three months of PF base salary, up to 75% of your balance.',
        usage: 'Used 0 of 3',
        eligible: true,
      },
    ],
  },
]

/**
 * The entitlement, and the four limits behind it.
 *
 * The binding limb here is the member's own balance -- the trust can only advance what the account
 * holds -- which is exactly why showing all four matters. Asking for more would not help.
 */
export const entitlement = {
  amount: '2780690.00',
  limbs: [
    { label: '36 × your PF base salary', amount: '3240000.00', binding: false },
    { label: 'Your total PF balance', amount: '2780690.00', binding: true },
    { label: 'Cost you declared', amount: '4800000.00', binding: false },
    { label: 'Amount you asked for', amount: '3000000.00', binding: false },
  ],
  explanation:
    'The lowest of the four is what you get. Here it is your own balance — the trust can only advance what your account holds.',
  balanceAfter: '0.00',
  balanceAfterNote: 'Drawing the maximum empties the account. Most members draw far less.',
}

/** Only loan type 01 has rows in loan_document_mapping. The other eleven return an empty list. */
export const loanDocuments = [
  { name: 'Sale Agreement', detail: 'sale-agreement.pdf · 2.1 MB', state: 'attached' },
  { name: 'Stamp Duty / Registration Receipt', detail: 'PDF or JPG, up to 5 MB', state: 'required' },
  { name: 'Builders Receipt', detail: 'PDF or JPG, up to 5 MB', state: 'required' },
]

export const loan = {
  reference: 'PFL/2026-27/00184',
  title: 'Purchase of residential flat',
  appliedOn: '02-08-2026',
  status: { label: 'Awaiting final approval', tone: 'awaiting-final' },
  steps: [
    { label: 'Submitted', when: '02 Aug 2026', state: 'done' },
    { label: 'Checked and approved', when: '18 Aug 2026', state: 'done' },
    { label: 'Second approval', when: 'Waiting since 18 Aug', state: 'current' },
    { label: 'Paid to your bank', when: 'Not yet', state: 'todo' },
  ],
  reassurance:
    'Every advance is signed off by two different people, and it is with the second of them now. If a document needs redoing you will get an email and this page will say so.',
  summary: [
    { label: 'Purpose', value: 'Purchase of Residential House/Flat' },
    { label: 'Total cost declared', value: '4800000.00', numeric: true },
    { label: 'Amount asked for', value: '3000000.00', numeric: true },
    { label: 'Approved amount', value: '2780690.00', numeric: true, strong: true },
    { label: 'Paid into', value: 'HDFC ••••4471' },
  ],
  documents: ['Sale Agreement', 'Stamp Duty / Registration Receipt', 'Builders Receipt'],
  history: [
    { label: 'Sent for second approval', at: '18 Aug 2026, 16:20' },
    { label: 'Approved by the PF department', at: '18 Aug 2026, 16:20' },
    { label: 'Documents received', at: '11 Aug 2026, 10:04' },
    { label: 'Application submitted', at: '02 Aug 2026, 09:12' },
  ],
}

export const profile = {
  name: 'Sunita Deshmukh',
  dateOfBirth: '18 March 1984 · 42 years',
  // Masked by the API, not by this page -- the member record never carries the full value.
  pan: '•••••2841F',
  aadhaar: '•••• •••• 6207',
  mobile: '98220 41123',
  email: 'sunita.d@example.com',
  // Never populated by the retired Python importer, so genuinely blank for older records.
  alternateMobile: null,
  pfNumber: '104782',
  pernNumber: '30045512',
  uanNumber: '100234567891',
  tokenNumber: 'T-40218',
  joinedCompany: '02 January 2012',
  joinedFund: '02 January 2012 · 14 years 7 months',
  unit: '1204 · Nashik · Quality Assurance',
  previousEmployers: [
    { name: 'Kirloskar Oil Engines Ltd', period: 'Jul 2007 – Dec 2011 · Pune', status: 'PF transferred in', done: true },
    { name: 'Bharat Forge Ltd', period: 'Aug 2004 – Jun 2007 · Pune', status: 'Transfer under way', done: false },
  ],
  nominees: [
    { name: 'Rohan Deshmukh', relationship: 'Son', share: 50 },
    { name: 'Aarti Deshmukh', relationship: 'Mother', share: 30 },
  ],
  nomineeTotal: 80,
  bank: {
    name: 'HDFC Bank',
    branch: 'Nashik Road branch',
    account: '••••••••4471',
    codes: 'HDFC0000521 · MICR 422240002',
  },
}

export const tickets = [
  {
    reference: 'PFT-4471',
    subject: 'June contribution missing',
    category: 'Contributions',
    status: { label: 'Being looked at', tone: 'info' },
    askedOn: '12 Aug 2026',
    lastActivity: 'Last reply 13 Aug 2026',
    closed: false,
    messages: [
      {
        from: 'you',
        body: 'My June contribution has not appeared in the passbook, though it was deducted from my salary. Payslip attached.',
        attachment: 'payslip-jun-2026.pdf',
        at: '12 Aug 2026, 09:41',
      },
      {
        from: 'department',
        body: 'June came through in the payroll feed we received on 08 August and is posted now — you should see it in the passbook. Nothing was missing from your account; the feed simply runs a month behind.',
        at: '13 Aug 2026, 15:07',
      },
    ],
  },
  {
    reference: 'PFT-4102',
    subject: 'How long does a transfer in take?',
    category: 'Transfer ins',
    status: { label: 'Closed', tone: 'muted' },
    askedOn: '02 Jul 2026',
    lastActivity: 'Closed 09 Jul 2026',
    closed: true,
    messages: [
      { from: 'you', body: 'I applied for a transfer in from Bharat Forge in April. How long does this normally take?', at: '02 Jul 2026, 11:20' },
      { from: 'department', body: 'Three to six months is normal. We write to the previous trust for Annexure K and cannot move faster than they reply. Nothing is needed from you meanwhile.', at: '09 Jul 2026, 10:02' },
    ],
  },
  {
    reference: 'PFT-3866',
    subject: 'Nominee share correction',
    category: 'Your details',
    status: { label: 'Closed', tone: 'muted' },
    askedOn: '18 May 2026',
    lastActivity: 'Closed 22 May 2026',
    closed: true,
    messages: [
      { from: 'you', body: 'I would like to change my nominee shares.', at: '18 May 2026, 14:02' },
      { from: 'department', body: 'Updated as requested. Please check the profile screen and raise this again if anything still looks wrong.', at: '22 May 2026, 09:15' },
    ],
  },
]
