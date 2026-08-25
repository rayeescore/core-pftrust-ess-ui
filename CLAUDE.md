# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## What this is

The **ESS (Employee Self-Service) portal** for CorePF Trust — the member-facing half of the PF system.
Its audience is every PF member (~16,700 employees), not the trust staff the admin portal serves.

| | Admin portal | **This repo** |
|---|---|---|
| Repo | `core-pftrust-ui` | `core-pftrust-ess-ui` |
| Host | `corepft.mahindra.com` | `corepftess.mahindra.com` (UI 6064) |
| API | `corepftapi.mahindra.com` (5055) | `corepftessapi.mahindra.com` (**6065**) |
| Stack | Vue 3 + **Vuetify 3** | Vue 3 + **Tailwind CSS 4, no component library** |

**The backend is not a new codebase.** `core-pftrust-service` is deployed a second time on port 6065
against the same tenant database — one set of business rules, one migration history, one Keycloak. The
member surface is isolated at the controller only, under `/api/v1/me`.

## Build & run

```bash
cp .env.example .env.local     # then fill in
npm install
npm run dev                    # port 6064 -- 5173 belongs to the admin UI
npm run build
```

`VITE_USE_FIXTURES` has three settings, because the project is genuinely in three states at once:

| | |
|---|---|
| `false` | every call live. Honest, and today it leaves most of the dashboard empty |
| `true` | no API and no sign-in. For looking at screens; **never** in a deployment |
| `partial` | live where the handler exists, fixtures where it does not — real sign-in *and* a complete dashboard |

`partial` is the useful setting while Phase 3 is being built. The list of what is actually live is the
`LIVE` set in `src/api/me.js`; edit it as handlers land, and when it covers everything the flag and the
branching both go away.

## The design is already done

Nineteen artboards over eight pages: <https://claude.ai/code/artifact/b6b8c3ae-5c78-4826-80f1-81dfb1f6ab6a>
Pages: Dashboard · Passbook · Apply for an advance (5 steps + tracker) · Profile & corrections ·
Transfer in & exit · Help · **States** · **Foundations**.

**Build against the artboard source, not a description of it.** The canvas's `.dc.html` files carry the
real markup — exact oklch values, type sizes, spacing, and the SVG paths behind `AppIcon`. A first pass
built from the *text* of the artboards produced something that read as a generic admin dashboard: no
logo mark, no icons, sans-serif money, buckets floating beside the balance instead of nested inside it,
and a circle stepper on the dashboard where the design uses a compact four-segment bar. Every one of
those is visible at a glance and none of it was inferable from prose.

The two pages worth reading even if you are not building a screen are Foundations (tokens and the
component inventory) and States — nine states with real copy that a member visiting twice a year meets
more often than the happy path.

Two treatments that are decisions rather than reflows:

- **The display face is a serif, and it carries the money.** A balance set in the same sans as the
  navigation is a data cell; set in Tiro it is a statement. `MoneyDisplay`'s `display` size is the only
  place this matters and it is the difference between this reading as a portal and as a console.
- **On a phone the three balance buckets become a legend**, one hue at three weights — not three
  stacked cards. They are parts of one total, and three hues would say they are separate categories.

The design brief with the backend constraints behind it is `docs/ESS_PORTAL_DESIGN_BRIEF.md` in the
`core-pftrust-service` repo.

## What exists and what does not

**Built:** every screen on the canvas — dashboard, passbook, the five-step advance flow and its
tracker, profile, corrections, transfer-in, claims, and help — plus the shell, Keycloak auth with
silent refresh, the API client, the formatting rules and the component set behind all of it.

**Not built: almost all of the member API.** Only `GET /api/v1/me` exists in `core-pftrust-service`;
every other call in `src/api/me.js` is still a fixture, and the `LIVE` set there is the list to edit as
handlers land. So the screens are complete and most of them are showing the design canvas's member
rather than the signed-in one.

Four screens also depend on backend work that has not started, and each says so where a member would
otherwise be misled:

- **Documents step** — `loan_document_mapping` is seeded for loan type 01 only, so eleven of the twelve
  purposes return an empty list. The screen shows "No documents are mapped for this purpose", not "you
  need none", because those are very different sentences.
- **Details step** — `POST /api/v1/loan` demands the property block *and* a repayment-bank block for
  every purpose, and asks the member for the trust's own paying bank. All three need relaxing.
- **Loan tracker** — only transfer-in stores a rejection reason, so a refused advance cannot yet say why.
- **Claims** — `SettlementFinalDetails` is only written once a clerk has keyed the settlement in, so the
  worksheet a leaver needs in order to choose is produced *after* they have chosen.

## Rules this app is built on

These come from the backend and are not style preferences.

**Never send an identifier for a person.** Not `employeeId`, `pfNumber`, `pernNumber` or `entityId`. The
caller is resolved from the JWT once, server-side, which is what makes ownership structural rather than a
check somebody forgets. If a call seems to need an employee id, the endpoint you want does not exist and
should not. (The staff API's `GET /employee/{pfNumber}/pfNumber` is exactly what this avoids — see H2 in
`docs/SECURITY_AUDIT.md`.)

**The brand red is not the rejected red.** `--color-brand-500` is identity and primary action.
`--color-danger-500` is a different colour on purpose — hue 12 rather than 25, and darker. If those two
ever converge, a member cannot tell a page header from a refusal.

**`₹—` is not `₹0`.** A null amount means "not computed yet" — interest before year end, a settlement
estimate before the worksheet exists. `MoneyDisplay` renders that as an em dash. Never default an amount
to zero to make a template simpler; a zero is a fact and a dash is a wait.

**A financial year is named by the year it ends in, and is never shown as a bare number.** April 2025 is
FY 2026, displayed "FY 2025–26". Use `financialYear()` in `src/composables/useFormat.js`.

**Month 0 is the opening balance, not a thirteenth month.** The passbook's first row is a
brought-forward balance and gets its own treatment.

**Status labels arrive already translated.** The API maps `ApplicationStatus` to member-facing words
server-side, so `PENDING_FINAL_APPROVAL` never reaches a browser and every client says the same thing.
`StatusChip` maps the *tone*, never the wording.

**Errors sit beside what failed; toasts are for confirmations only.** A balance that fails to load shows
its own error and leaves the rest of the dashboard alone — see `DashboardView.vue`, which is why each
section has its own ref rather than one shared `loading` flag.

**Skeletons, never spinners.** Three card-shaped blanks tell a member three numbers are coming.

**44px minimum hit target.** Most members are on a phone. `AppButton`'s `sm` size is desktop-only.

## Tailwind 4 specifics

There is **no `tailwind.config.js`** — v4 is CSS-first. The design system is the `@theme` block in
`src/assets/theme.css`, and every custom property there becomes both a utility class and a runtime CSS
variable (so charts can read the same palette). Tailwind is a Vite plugin here, not a PostCSS step.

Colours are authored in **oklch**, not hex. `#d90f2d` is exactly the kind of saturated red that shifts
when a naive hex conversion meets a wide-gamut display.

v4 needs Safari 16.4+ / Chrome 111+ / Firefox 128+. For a portal reaching whatever phone people actually
have that is a real exclusion, and it has not been resolved — the two things that must work on anything
are statement download and balance.

## Deployment

Same shape as `core-pftrust-ui`: multi-stage Dockerfile, nginx serving `dist` with history-mode
fallthrough and a CSP. The CSP's `blob:` entries in `connect-src`, `img-src` and `worker-src` are for PDF
previews and break silently if removed.

**Before this can call the API at all**, `corepftess.mahindra.com` has to be added to
`SecurityConfiguration.ALLOWED_ORIGINS` and the CSP directive in `core-pftrust-service`. That list also
feeds `corsAwareAuthEntryPoint()` — the **401 path** — so until it is there, a session expiry arrives as
an opaque CORS error and the re-authentication modal in `App.vue` never fires.
