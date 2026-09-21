<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import * as me from '@/api/me'
import { displayDate, financialYear, money } from '@/composables/useFormat'
import { useDownload } from '@/composables/useDownload'
import AppBanner from '@/components/ui/AppBanner.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import FinancialYearSelect from '@/components/ui/FinancialYearSelect.vue'
import { ALL, NON_TAXABLE, TAXABLE, isHalf, rowFor, summaryFor } from '@/composables/usePassbookHalves'

/**
 * The contribution passbook: every rupee in and out of the account, month by month.
 *
 * Four things here are decisions rather than layout, and all four come from how this system actually
 * works:
 *
 *  - **Month 0 is the opening balance, not a thirteenth month.** The API's month list is literally
 *    ["OPENING BALANCE","APRIL",...,"MARCH"]. It gets the brought-forward treatment -- tinted, labelled
 *    with the year it came from -- rather than sitting in the sequence pretending to be April.
 *  - **Transfer-in credits and loan withdrawals sit inline between the months.** They move the balance,
 *    and a member who cannot see them concludes money has gone missing.
 *  - **The interest column is empty all year, on purpose**, and the page says so at the bottom. Interest
 *    is worked out once, after March. An empty column with no explanation reads as data that failed to
 *    load, which is the one reading that would send somebody to the PF department.
 *  - **The taxable filter reaches every figure on the page**, summary and footer included, and it does
 *    it by swapping which object each row is read from rather than by halving anything here. See
 *    `usePassbookHalves`. It used to reach none of them: `taxView` was bound to the control and read by
 *    nothing at all, so pressing Taxable moved the highlight and left every rupee where it was --
 *    which on a financial screen is worse than having no filter, because the member believes it.
 */
const year = ref(2027)
const taxView = ref(ALL)
const passbook = ref(null)
const years = ref([2027])
const { busy, failure, download } = useDownload()

const taxViews = [
  { value: ALL, label: 'All' },
  { value: TAXABLE, label: 'Taxable' },
  { value: NON_TAXABLE, label: 'Non-taxable' },
]

async function load() {
  passbook.value = null
  passbook.value = await me.getPassbook(year.value)
}

onMounted(async () => {
  years.value = await me.getContributedYears()
  await load()
})

watch(year, load)

/** Eight columns, and the first is wider because it carries a month name and sometimes a sub-line. */
const GRID = 'grid-cols-[1.5fr_0.95fr_1fr_1fr_0.95fr_0.9fr_1.05fr_1fr]'

/**
 * The rows as the chosen view shows them, and the summary to match.
 *
 * Both go through the same pair of functions, so the table, the five figures above it and the footer
 * total cannot end up reading different halves of the same year.
 */
const rows = computed(() => (passbook.value?.rows ?? []).map((row) => rowFor(row, taxView.value)))

const summary = computed(() => summaryFor(passbook.value, taxView.value))

/** Whether the member is looking at a half, and is therefore owed the note about the company share. */
const filtered = computed(() => isHalf(taxView.value))

const halfLabel = computed(() => (taxView.value === TAXABLE ? 'taxable' : 'non-taxable'))

/**
 * Which month cards are open on a phone.
 *
 * Eight columns do not fit on a 390px screen, and the honest alternative -- a table 900px wide inside a
 * horizontal scroller -- showed a member the month and about half of one figure, with nothing on screen
 * saying the rest was there. So below `sm` the same rows are cards: the month, the day it posted and the
 * month's total on the face, the your/company/VPF split on tap. This is PassbookMobile on the canvas,
 * and it is what the design brief asked for in §5.2.
 */
const opened = ref(new Set())

function toggle(key) {
  // A new Set each time: mutating one in place is not a reactive change.
  const next = new Set(opened.value)
  next.has(key) ? next.delete(key) : next.add(key)
  opened.value = next
}
</script>

<template>
  <div class="flex flex-col gap-[22px]">
    <!-- HEADER -->
    <!--
      `shrink-0` on the control group used to keep it at its 555px max-content width, so on a phone the
      year picker and the statement button sat off the right edge of the screen entirely -- a member
      could neither change the year nor download anything. The group wraps now, and the taxable filter
      is desktop-only, as PassbookMobile draws it.
    -->
    <header class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-7">
      <div class="flex flex-col gap-[7px]">
        <h1 class="font-display text-[25px] leading-[1.15] sm:text-[30px]">Contribution passbook</h1>
        <p class="text-[13.5px] text-ink-muted">Every rupee in and out of your account, month by month.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <SegmentedControl v-model="taxView" :options="taxViews" class="hidden sm:flex" />
        <FinancialYearSelect v-model="year" :years="years" class="min-w-0 flex-1 sm:flex-none" />
        <button
          class="flex min-h-11 shrink-0 items-center gap-[9px] rounded-[10px] bg-action-fill px-[18px] py-[11px] text-sm font-semibold text-on-brand transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="busy !== null"
          @click="download('monthly', () => me.getMonthlyStatement(year))"
        >
          <AppIcon name="download" :size="16" />
          {{ busy ? 'Preparing…' : 'Statement' }}
        </button>
      </div>
    </header>

    <AppBanner v-if="failure" tone="danger" title="That download did not work">{{ failure }}</AppBanner>

    <template v-if="passbook">
      <!-- SUMMARY -->
      <!-- Five figures that reconcile: opening + contributed + transferred in − withdrawn = balance.
           A member checking the arithmetic is exactly who this row is for. -->
      <div
        class="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5"
      >
        <div
          v-for="cell in [
            { label: `Opening · ${summary.openingLabel}`, value: summary.opening, sign: '' },
            { label: 'Contributed', value: summary.contributed, sign: '+ ' },
            { label: 'Transferred in', value: summary.transferredIn, sign: '+ ' },
            { label: 'Withdrawn', value: summary.withdrawn, sign: '− ' },
          ]"
          :key="cell.label"
          class="flex flex-col gap-1 bg-surface px-[18px] py-4"
        >
          <p class="eyebrow eyebrow-faint">{{ cell.label }}</p>
          <p class="tabular text-[19px] font-semibold">{{ cell.sign }}₹{{ money(cell.value) }}</p>
        </div>
        <div class="flex flex-col gap-1 bg-brand-50 px-[18px] py-4">
          <p class="eyebrow" style="color: var(--color-brand-700)">
            {{ filtered ? `${halfLabel} balance` : 'Balance' }} · {{ summary.closingLabel }}
          </p>
          <p class="tabular text-[19px] font-semibold" style="color: var(--color-brand-700)">
            ₹{{ money(summary.closing) }}
          </p>
        </div>
      </div>

      <!-- TABLE — from `sm` up, where eight columns have somewhere to go. -->
      <div class="hidden overflow-x-auto rounded-card border border-border bg-surface sm:block">
        <div class="min-w-[900px]">
          <div
            class="eyebrow eyebrow-faint grid gap-2.5 border-b border-border bg-surface-deep px-5 py-[11px] !text-[11px] !text-ink-muted"
            :class="GRID"
          >
            <div>Month</div>
            <div class="text-right">PF base</div>
            <div class="text-right">Yours</div>
            <div class="text-right">Company</div>
            <div class="text-right">VPF</div>
            <div class="text-right">Interest</div>
            <div class="text-right">Month total</div>
            <div class="text-right">Posted on</div>
          </div>

          <template v-for="row in rows" :key="row.key">
            <!-- OPENING BALANCE — brought forward, not a month. -->
            <div
              v-if="row.type === 'opening'"
              class="grid items-center gap-2.5 border-b border-border bg-brand-50 px-5 py-[15px]"
              :class="GRID"
            >
              <div class="flex flex-col gap-px">
                <p class="text-sm font-semibold">Opening balance</p>
                <p class="text-[11px]" style="color: var(--color-brand-700)">
                  Brought forward from {{ financialYear(year - 1) }}
                </p>
              </div>
              <p class="tabular text-right text-[13.5px] text-ink-faint">—</p>
              <p class="tabular text-right text-[13.5px] font-semibold">{{ money(row.member) }}</p>
              <p class="tabular text-right text-[13.5px] font-semibold">{{ money(row.company) }}</p>
              <p class="tabular text-right text-[13.5px] font-semibold">{{ money(row.vpf) }}</p>
              <p class="tabular text-right text-[13.5px] text-ink-faint">included</p>
              <p class="tabular text-right text-[13.5px] font-semibold">{{ money(row.total) }}</p>
              <p class="tabular text-right text-[13.5px] text-ink-muted">{{ displayDate(row.postedOn) }}</p>
            </div>

            <!-- A MONTH -->
            <div
              v-else-if="row.type === 'month'"
              class="grid items-center gap-2.5 border-b px-5 py-[13px]"
              style="border-color: oklch(0.945 0.006 80)"
              :class="GRID"
            >
              <p class="text-sm">{{ row.month }}</p>
              <p class="tabular text-right text-[13.5px] text-ink-muted">{{ money(row.pfBase) }}</p>
              <p class="tabular text-right text-[13.5px]">{{ money(row.member) }}</p>
              <p class="tabular text-right text-[13.5px]">{{ money(row.company) }}</p>
              <p class="tabular text-right text-[13.5px]">{{ money(row.vpf) }}</p>
              <p class="tabular text-right text-[13.5px] text-ink-faintest">—</p>
              <p class="tabular text-right text-[13.5px] font-semibold">{{ money(row.total) }}</p>
              <p class="tabular text-right text-[13.5px] text-ink-muted">{{ displayDate(row.postedOn) }}</p>
            </div>

            <!-- AN EVENT — money in or out, between the months it happened between. -->
            <div
              v-else-if="row.type === 'event'"
              class="flex items-center gap-3 border-b px-5 py-3"
              style="border-color: oklch(0.945 0.006 80); background: oklch(0.985 0.004 80)"
            >
              <AppIcon
                :name="row.direction === 'in' ? 'arrowIn' : 'arrowOut'"
                :size="16"
                class="text-ink-faint"
              />
              <div class="flex flex-1 flex-col gap-px">
                <p class="text-[13.5px] font-medium">{{ row.title }}</p>
                <p class="text-[11.5px] text-ink-faint">{{ row.detail }}</p>
              </div>
              <p class="tabular text-sm font-semibold">
                {{ row.direction === 'in' ? '+' : '−' }} {{ money(row.amount) }}
              </p>
              <p class="tabular w-24 text-right text-[13.5px] text-ink-muted">
                {{ displayDate(row.postedOn) }}
              </p>
            </div>
          </template>

          <!-- Months still to come are absent from the table rather than shown as empty rows: a blank
               row says "nothing was contributed", and this says "it has not been sent yet". -->
          <div
            v-if="passbook.unpostedNote"
            class="flex items-center gap-[11px] border-b border-border px-5 py-3.5"
            style="background: var(--color-surface-sub)"
          >
            <AppIcon name="clock" :size="16" class="text-ink-faintest" />
            <p class="text-[13px] text-ink-faint">{{ passbook.unpostedNote }}</p>
          </div>

          <div class="grid items-center gap-2.5 bg-surface-deep px-5 py-4" :class="GRID">
            <p class="text-[13.5px] font-semibold">Balance on {{ displayDate(summary.closingDate) }}</p>
            <p class="tabular text-right text-[13.5px] text-ink-faint">—</p>
            <p class="tabular text-right text-[14.5px] font-semibold">{{ money(summary.totals.member) }}</p>
            <p class="tabular text-right text-[14.5px] font-semibold">{{ money(summary.totals.company) }}</p>
            <p class="tabular text-right text-[14.5px] font-semibold">{{ money(summary.totals.vpf) }}</p>
            <p class="tabular text-right text-[13.5px] text-ink-faintest">—</p>
            <p class="tabular text-right text-[14.5px] font-semibold">{{ money(summary.closing) }}</p>
            <p />
          </div>
        </div>
      </div>

      <!--
        CARDS — the same rows below `sm`, per PassbookMobile on the canvas.

        Not a reflow of the table: a month's total is on the face and the split is behind a tap, because
        a member checking a phone wants to know that July went in, and only sometimes how it divided.
      -->
      <div class="flex flex-col gap-[9px] sm:hidden">
        <template v-for="row in rows" :key="row.key">
          <!-- OPENING BALANCE — brought forward, not a month. -->
          <div
            v-if="row.type === 'opening'"
            class="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3.5"
          >
            <div class="flex min-w-0 flex-col gap-0.5">
              <p class="text-sm font-semibold">Opening balance</p>
              <p class="text-[11.5px]" style="color: var(--color-brand-700)">
                Brought forward from {{ financialYear(year - 1) }}
              </p>
            </div>
            <p class="tabular shrink-0 text-[15px] font-semibold">₹{{ money(row.total) }}</p>
          </div>

          <!-- A MONTH — total on the face, split on tap. -->
          <div
            v-else-if="row.type === 'month'"
            class="rounded-xl border border-border bg-surface"
          >
            <button
              class="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              :aria-expanded="opened.has(row.key)"
              @click="toggle(row.key)"
            >
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="text-sm font-semibold">{{ row.month }}</span>
                <span class="tabular text-[11.5px] text-ink-faint">
                  Posted {{ displayDate(row.postedOn) }}
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-2">
                <span class="tabular text-[15px] font-semibold">₹{{ money(row.total) }}</span>
                <AppIcon
                  name="chevronDown"
                  :size="15"
                  class="text-ink-faint transition-transform"
                  :class="opened.has(row.key) ? 'rotate-180' : ''"
                />
              </span>
            </button>
            <dl
              v-if="opened.has(row.key)"
              class="mx-4 flex gap-4 border-t border-border-subtle py-3"
            >
              <div
                v-for="part in [
                  { label: 'Yours', value: row.member },
                  { label: 'Company', value: row.company },
                  { label: 'VPF', value: row.vpf },
                  { label: 'PF base', value: row.pfBase },
                ]"
                :key="part.label"
                class="flex flex-col gap-px"
              >
                <dt class="text-[11px] text-ink-faint">{{ part.label }}</dt>
                <dd class="tabular text-[13px] font-medium">{{ money(part.value) }}</dd>
              </div>
            </dl>
          </div>

          <!-- AN EVENT — money in or out, between the months it happened between. -->
          <div
            v-else-if="row.type === 'event'"
            class="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
            style="background: oklch(0.985 0.004 80)"
          >
            <AppIcon
              :name="row.direction === 'in' ? 'arrowIn' : 'arrowOut'"
              :size="16"
              class="shrink-0 text-ink-faint"
            />
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <p class="text-[13px] leading-[1.35] font-medium">{{ row.title }}</p>
              <p class="tabular text-[11px] text-ink-faint">{{ displayDate(row.postedOn) }}</p>
            </div>
            <p class="tabular shrink-0 text-sm font-semibold">
              {{ row.direction === 'in' ? '+' : '−' }}{{ money(row.amount) }}
            </p>
          </div>
        </template>

        <div
          v-if="passbook.unpostedNote"
          class="flex items-center gap-3 rounded-xl border border-dashed border-border-strong px-4 py-3.5"
        >
          <AppIcon name="clock" :size="16" class="shrink-0 text-ink-faintest" />
          <p class="text-[12.5px] leading-[1.5] text-ink-faint">{{ passbook.unpostedNote }}</p>
        </div>

        <!-- The closing split, which on desktop is the table's footer row and lives nowhere else. -->
        <div class="rounded-xl border border-border bg-surface-deep px-4 py-3.5">
          <div class="flex items-center justify-between gap-3">
            <p class="text-[13.5px] font-semibold">
              Balance on {{ displayDate(summary.closingDate) }}
            </p>
            <p class="tabular shrink-0 text-[15px] font-semibold">₹{{ money(summary.closing) }}</p>
          </div>
          <dl class="mt-3 flex gap-4 border-t border-border py-0 pt-3">
            <div
              v-for="part in [
                { label: 'Yours', value: summary.totals.member },
                { label: 'Company', value: summary.totals.company },
                { label: 'VPF', value: summary.totals.vpf },
              ]"
              :key="part.label"
              class="flex flex-col gap-px"
            >
              <dt class="text-[11px] text-ink-faint">{{ part.label }}</dt>
              <dd class="tabular text-[13px] font-medium">{{ money(part.value) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!--
        WHY THE COMPANY COLUMN IS EMPTY IN A HALF

        Only while a half is showing, and above the interest note because it explains a blank the member
        is looking at right now. The company's contribution carries no taxable classification in the
        trust's books -- the rule classifies the member's own money -- so a half shows a dash for it
        rather than a zero, and the figures in a half deliberately do not add up to the whole year.
      -->
      <aside
        v-if="filtered"
        class="flex items-start gap-3 rounded-xl border border-border bg-surface-sub px-[17px] py-3.5"
      >
        <AppIcon name="info" :size="18" class="mt-px text-ink-faint" />
        <div class="flex flex-col gap-[3px]">
          <p class="text-[13.5px] font-semibold">Company contribution is not shown in this view</p>
          <p class="text-[13px] leading-[1.55] text-ink-muted">
            The {{ halfLabel }} split applies to your own contribution and your VPF. Your company’s
            contribution is not classified either way, so it shows a dash — the figures here are your
            own money, and they are smaller than your full balance for that reason. Choose
            <strong>All</strong> to see the whole account.
          </p>
        </div>
      </aside>

      <!-- WHY THE INTEREST COLUMN IS EMPTY -->
      <aside class="flex items-start gap-3 rounded-xl border border-info-200 bg-info-50 px-[17px] py-3.5">
        <AppIcon name="info" :size="18" class="mt-px text-info-700" />
        <div class="flex flex-col gap-[3px]">
          <p class="text-[13.5px] font-semibold" style="color: oklch(0.37 0.085 250)">
            Why the interest column is empty
          </p>
          <p class="text-[13px] leading-[1.55]" style="color: oklch(0.45 0.06 250)">
            Interest is worked out once a year, after March, and added to your opening balance for the
            next year. It has not been missed — there is simply nothing to show until the year closes.
            Last year it was credited at {{ passbook.lastRate }}%.
          </p>
        </div>
      </aside>
    </template>

    <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
  </div>
</template>
