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

**`VITE_USE_FIXTURES=true` renders every screen against `src/fixtures/member.js` with no API and no
sign-in.** That flag exists because the member API does not yet — see below. It is for looking at the
screens and must never be set in a deployment.

## The design is already done

Nineteen artboards over eight pages: <https://claude.ai/code/artifact/b6b8c3ae-5c78-4826-80f1-81dfb1f6ab6a>
Pages: Dashboard · Passbook · Apply for an advance (5 steps + tracker) · Profile & corrections ·
Transfer in & exit · Help · **States** · **Foundations**.

Read it before building a screen. The two pages worth reading even if you are not building a screen are
Foundations (tokens and the component inventory) and States — nine states with real copy that a member
visiting twice a year meets more often than the happy path.

The design brief with the backend constraints behind it is `docs/ESS_PORTAL_DESIGN_BRIEF.md` in the
`core-pftrust-service` repo.

## What exists and what does not

**Built:** the design tokens, the app shell, Keycloak auth with silent refresh, the API client, the
formatting rules, five UI primitives, two product components, and the dashboard.

**Not built:** everything else, and — the thing to know before planning any work here — **the member API
itself.** There is no `/api/v1/me` in `core-pftrust-service` yet. What *is* built there is the identity
binding: `pf/identity` provisions a Keycloak account per member, username = **PF number lower-cased**,
with the `MEMBER` realm role. So members can sign in; there is just nothing yet for them to read.

Adding a screen therefore usually means adding its handler on the API side first.

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
