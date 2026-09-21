# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## What this is

The **ESS (Employee Self-Service) portal** for CorePF Trust — the member-facing half of the PF system.
Its audience is every PF member (~16,700 employees), not the trust staff the admin portal serves.

| | Admin portal | **This repo** |
|---|---|---|
| Repo | `core-pftrust-ui` | `core-pftrust-ess-ui` |
| Host | `corepft.mahindra.com` | `corepftess.mahindra.com` (UI 6064) |
| API | `corepftapi.mahindra.com` (5055) | **the same**, `corepftapi.mahindra.com` (5055) |
| Stack | Vue 3 + **Vuetify 3** | Vue 3 + **Tailwind CSS 4, no component library** |

**The backend is not a new codebase, and not a second deployment either.** The member surface lives in
`core-pftrust-service` under `/api/v1/me`, isolated at the controller only, and that service is deployed
**once** — one set of business rules, one migration history, one Keycloak, one process. **Decided
2026-09-16**: the plan had been a second deployment on 6065 behind `corepftessapi.mahindra.com`; that
hostname is dropped and this portal calls the admin API.

So ESS ships as a **UI deployment only** (6064), and this app is a cross-origin caller of that API. Two
things must agree or the portal breaks in a way no screen explains: the CSP `connect-src` in
`nginx/nginx.conf` and `VITE_API_BASE_URL` in `.env.mahindra`, both naming `corepftapi.mahindra.com`.
The API side already names `corepftess.mahindra.com` in its CORS list and its 401 entry point.

**`.env.mahindra` is committed**, as `core-pftrust-ui`'s is. Vite inlines every `VITE_` value into the
bundle, so none of them can be a secret and all of them are already readable by anyone who opens the
portal — while leaving the file out meant the production build depended on something nobody could see.
`.gitignore` still hides every other `.env.*`.

## Build & run

```bash
cp .env.example .env.local     # then fill in
npm install
npm run dev                    # port 6064 -- 5173 belongs to the admin UI
npm run build
npm run lint                   # eslint 9 flat config, correctness rules only
```

`eslint.config.js` was added on 2026-09-16: the `lint` script had existed since the first commit with no
config to run against, so it failed before checking anything. The rules are `vue/flat/essential` plus the
JS recommended set — what makes a component wrong, not how it is formatted, since this project's
formatting is by hand.

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
tracker, profile, corrections and the correction history, transfer-in and its tracker, claims and the
claim tracker, help and the trust page — plus the shell, Keycloak auth with silent refresh, the API
client, the formatting rules and the component set behind all of it.

**`/profile/corrections` is the form and `/profile/corrections/history` is the list, and that split is
not arbitrary.** `MemberDashboardController` builds the nominee and bank alerts server-side with the
literal string `/profile/corrections`, so that path has to keep meaning "the form" — a member who clicks
"your nomination is incomplete" wants the form, not a list of what they have already sent. The history
row expands in place rather than linking to a detail route: `GET /me/change-requests` already returns
every before-and-after pair, the decision reason and `hasAttachment`, so `getChangeRequest(id)` in
`src/api/me.js` still has no caller, deliberately. The wording both screens share — the summary join and
the two phrases for an absent value — is `src/composables/useChangeRequests.js`, because the profile card
and the history list show the same request and did so through two copies of the same join before it.

**The member API behind it is built too** (43 handlers in `core-pftrust-service`, as of 2026-09-16). Every
function in `src/api/me.js` is in the `LIVE` set; `VITE_USE_FIXTURES=partial` is now only a way to pull a
single screen back to a fixture by deleting its line. Nothing on the brief is unbuilt on either side.

**Downloads save a file; they do not open a tab.** `src/composables/useDownload.js` holds the state a
view needs (`busy`, `failure`, `download`) and writes the blob out through a temporary `<a download>`.
`window.open` after an `await` is the thing it avoids: by then the click's user activation has usually
lapsed and a popup blocker — Safari's on a phone especially — may refuse the tab. It also reads the API's
sentence out of a 404, which on a blob request arrives as a `Blob` rather than JSON.

**Every attachment saves through `useDownload` too.** `TransferInDetailView`, `ClaimDetailView`,
`ProfileView` and `HelpView` used to `window.open` a blob after an `await`, and read
`failure.response?.data?.message` off what is a `Blob` on a blob request, so the API's sentence never
reached the member. Moved 2026-09-16. The four attachment reads in `api/me.js` return
`{ blob, filename }` like the statement calls, so no view composes a filename of its own.

**The advance form asks what the purpose asks, and the purpose says so.** Every purpose carries an
`asks` array from `GET /me/loans/types`; `useLoanFields` reads it and nothing else. It used to be
`draft.group === 'Housing'`, which is the trust's **eligibility** grouping and never said anything
about property — true of the seven codes the master shipped with, and false the day `V0_0_111` added
**code 06, Pension on Heigher Wages, to group A**. Three purposes look different for it: **02 asks when
the house was finished and for none of the costs**, **13 asks for the lender and for no property**, and
06 asks for neither although it is filed with the housing codes. The amount step's first question is
worded from the same place (`costQuestion`) — it asked *"What will the flat cost in total?"* of a
marriage, a hospital admission and a pre-retirement withdrawal alike. Switching purpose mid-flow drops
the answers the new purpose does not ask for (`propertyFor` / `repaymentBankFor`), and the review step
now shows the property and the lender back, which it never did: a member repaying a housing loan typed
the account the money would go to and submitted without seeing it again. The API drops anything sent
for a purpose that did not ask for it, so none of this is the only guard — but a field the member can
neither see nor clear should not travel with their application.

One screen still depends on backend data that is missing, and says so where a member would otherwise be
misled:

- **Documents step** — `loan_document_mapping` is seeded for loan type 01 only, so eleven of the twelve
  purposes return an empty list. The screen shows "No documents are mapped for this purpose", not "you
  need none", because those are very different sentences.

**Claims show no estimate, on purpose** (decided 2026-09-15). Interest runs to the settlement due date,
which the PF department sets when it accepts the claim; the amount appears on `/claims/:id` after that.
The claim form shows the bank account and PAN read-only — they come from the record, never from the form.

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

**`₹—` is not `₹0`.** A null amount means "not computed yet" — interest before year end, a claim's
net credit before the PF department has accepted it. `MoneyDisplay` renders that as an em dash. Never default an amount
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

**44px minimum hit target.** Most members are on a phone. `AppButton`'s `sm` size is desktop-only. A
control inside a `<label>` is exempt, because the label's whole plate is the target — that is why the
advance declaration's 16px checkbox is fine and a bare 20px `<button>` is not.

## Mobile, and the four rules that keep it working

Audited and fixed on 2026-09-18 across the eighteen routes that existed then, at 320 / 360 / 390 / 430
/ 768 / 1280, in both the loading and the loaded state. `/profile/corrections/history` (2026-09-21) was
built to these rules but has **not** been through that script — it is the one route the measured audit
does not cover. Four things had gone wrong, and each is a rule rather than a
one-off fix — a headless CDP script that walks every route at every width, measures
`documentElement.scrollWidth` against `clientWidth`, and reports control font sizes and target heights
is the cheap way to re-check after any layout change.

**A grid or flex item's automatic minimum is its min-content, so one unbreakable string widens the
page.** The dashboard scrolled sideways by 66px on a 390px phone because an application card held a
mono reference and a `whitespace-nowrap` status chip, and the single mobile column of
`lg:grid-cols-[1.55fr_1fr]` sized itself to fit them. Every one of those thirteen sections now carries
`*:min-w-0`, and a flex child that holds text next to something `shrink-0` needs `min-w-0` too. Note
what does NOT fix it: `grid-cols-[minmax(0,1fr)]` floors the *track*, and the item still overflows it.

**A control under 16px zooms iOS Safari in on focus, and it does not zoom back out.** Every field in
the portal was 14–15px. `theme.css` now floors `input, select, textarea` at `max(16px, 1em)` in the
base layer — but a `text-sm` utility on the control still beats it, because utilities outrank base, so
do not put one there. `-webkit-text-size-adjust` does not help; only the computed size does.

**Padding belongs to the control, not to the box around it.** `FormField` and `ChangeDiffRow` drew a
46px plate with `py-3` and a 23px input inside it, so a thumb landing anywhere but on the text focused
nothing. Both now use `py-0` with `[&>input]:min-h-11`.

**The artboards include the mobile screens, and they are not a reflow of the desktop ones.**
`PassbookMobile.dc.html` and `DashboardMobile.dc.html` are on the canvas. The passbook's eight-column
table (`min-w-[900px]` in a scroller) showed a phone the month and half of one figure; below `sm` the
same rows are cards with the month total on the face and the split on tap, which is the artboard and
also §5.2 of the brief. The taxable filter is desktop-only there, and `ContributionYearChart`'s twelve
month labels need ~300px against a phone card's ~220, so they are `hidden sm:flex`. Page headings are
25px below `sm`.

Two divergences from the mobile artboards are still open, and both are design rather than breakage:
DashboardMobile draws the quick actions as a 2×2 grid of tiles (built: a vertical list), and trims the
identity line to PF + unit with the status chip inline (built: PF, PERN, UAN and unit, chip on its own
line).

## Tailwind 4 specifics

There is **no `tailwind.config.js`** — v4 is CSS-first. The design system is the `@theme` block in
`src/assets/theme.css`, and every custom property there becomes both a utility class and a runtime CSS
variable (so charts can read the same palette). Tailwind is a Vite plugin here, not a PostCSS step.

The block is plain `@theme`, not `@theme inline`, and that is load-bearing — see "Branding is served,
not built in".

Colours are authored in **oklch**, not hex. `#d90f2d` is exactly the kind of saturated red that shifts
when a naive hex conversion meets a wide-gamut display.

v4 needs Safari 16.4+ / Chrome 111+ / Firefox 128+. For a portal reaching whatever phone people actually
have that is a real exclusion, and it has not been resolved — the two things that must work on anything
are statement download and balance.

## Branding is served, not built in

**Since 2026-09-19** the portal's colours, its mark, its tab and the PF department's contact strings come
from `GET /api/v1/branding` — the tenant's own row in `tenant_configuration`, read once at boot by
`src/branding/branding.js` before `app.mount()`. This is phase 3 of the tenant configuration series;
phase 1 (the service) and phase 2 (the staff portal, where a `TRUST_ADMIN` edits all of it) are its
dependencies, and the design is
`core-pftrust-service/docs/superpowers/specs/2026-09-18-tenant-configuration-design.md`.

**The whole retint is ten custom properties on `:root`.** Tailwind 4's `@theme` compiles to real
custom properties and every utility reads them through `var()`, so setting
`--color-brand-500`, `--color-brand-{50,100,600,700}`, `--color-bucket-{1,2,3}`, `--color-action-fill`
and `--color-on-brand` on `document.documentElement` repaints every screen with no rebuild.
**Never change `@theme` to `@theme inline`** — that bakes each value into its utilities and ends this
silently, everywhere at once.

**No palette arithmetic happens in the browser.** The ramp, the buckets and the action pair are derived
server-side in OKLCH from one hex per portal, so this portal and the staff portal cannot drift. The
module only ever paints what it is handed, and every value it does not receive falls back to the literal
in `theme.css` — which is why an unconfigured tenant looks exactly like `main` did before this.

**`--color-action-fill` and `--color-on-brand` are a pair and are not `brand-500` and white.** The
server derives them together so the text on a filled control clears 4.5:1: white on the brand where it
passes, ink where it does not, a darkened fill where neither does. `brand-500` stays the tenant's raw
colour for bars and chart fills. Anything with text or an icon on top takes the pair —
`bg-action-fill text-on-brand` — and `grep -rn "bg-brand-500 .* text-white" src` must stay empty.

**That 4.5:1 guarantee is only for the resting state.** `AppButton`'s primary variant paints
`hover:bg-brand-600` and `active:bg-brand-700` — plain ramp stops, not a second derived pair — while the
foreground stays `--color-on-brand`. For every tenant configured today `onBrand` comes back white and
both states read fine, but a light brand colour (gold is the worked example) makes the server pick ink
for `onBrand`, and ink on the repaired `600`/`700` lands around 3.5:1 and 2.5:1 — under 4.5:1, and
`active:` is the one that bites hardest since a phone tap is what most members will ever see of it. The
fix belongs on the server, as an `actionFillHover` / `actionFillPressed` beside the existing pair, not a
browser-side `brightness()` filter — that would also retint every tenant whose hover already works,
which is the exact two-implementations drift this whole module exists to avoid. Until it lands, treat a
light brand colour as not yet supported.

**The branding read does not go through `src/api/client.js`.** That client prefixes `/api/v1/me` and
attaches a bearer token; this endpoint is public and is read before Keycloak has produced one. It builds
its absolute URL from `VITE_API_BASE_URL` because there is no global axios baseURL in this app.

**It runs in fixture mode too**, which is what lets the whole portal be checked in a browser with no
sign-in: `VITE_USE_FIXTURES=true npm run dev` against a running API paints the tenant's real branding
over fixture data.

`nginx/nginx.conf`'s `img-src` names the API origin. Without it the logo and favicon are blocked with
nothing on screen to say so, and the shell's built-in mark takes over — which looks exactly like a
tenant who uploaded nothing.

## Deployment

Same shape as `core-pftrust-ui`: multi-stage Dockerfile, nginx serving `dist` with history-mode
fallthrough and a CSP. nginx is `nginxinc/nginx-unprivileged` (UID 101, container port 8080, `GET /health`),
and `docker-compose-files/production/` maps host 6064 → 8080 with `seccomp:unconfined` — the CentOS 7
EC2 host's outdated seccomp profile rejects nginx's `pwrite()`, so without it the container exits at
startup. Drop that once the host's Docker/libseccomp is upgraded. `.dockerignore` keeps `*.local` out of
the build, because Vite reads `.env.local` above `.env.<mode>`. The CSP's `blob:` entries in `connect-src`, `img-src` and `worker-src` are for PDF
previews and break silently if removed.

**Before this can call the API at all**, `corepftess.mahindra.com` has to be added to
`SecurityConfiguration.ALLOWED_ORIGINS` and the CSP directive in `core-pftrust-service`. That list also
feeds `corsAwareAuthEntryPoint()` — the **401 path** — so until it is there, a session expiry arrives as
an opaque CORS error and the re-authentication modal in `App.vue` never fires.
