<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import * as me from '@/api/me'
import { displayDate, financialYear, money } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import FinancialYearSelect from '@/components/ui/FinancialYearSelect.vue'

/**
 * The contribution passbook: every rupee in and out of the account, month by month.
 *
 * Three things here are decisions rather than layout, and all three come from how this system actually
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
 */
const year = ref(2027)
const taxView = ref('all')
const passbook = ref(null)
const years = ref([2027])

const taxViews = [
  { value: 'all', label: 'All' },
  { value: 'taxable', label: 'Taxable' },
  { value: 'nonTaxable', label: 'Non-taxable' },
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

const rows = computed(() => passbook.value?.rows ?? [])
</script>

<template>
  <div class="flex flex-col gap-[22px]">
    <!-- HEADER -->
    <header class="flex flex-wrap items-end justify-between gap-7">
      <div class="flex flex-col gap-[7px]">
        <h1 class="font-display text-[30px] leading-[1.15]">Contribution passbook</h1>
        <p class="text-[13.5px] text-ink-muted">Every rupee in and out of your account, month by month.</p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-3">
        <SegmentedControl v-model="taxView" :options="taxViews" />
        <FinancialYearSelect v-model="year" :years="years" />
        <button
          class="flex min-h-11 items-center gap-[9px] rounded-[10px] bg-brand-500 px-[18px] py-[11px] text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <AppIcon name="download" :size="16" />
          Statement
        </button>
      </div>
    </header>

    <template v-if="passbook">
      <!-- SUMMARY -->
      <!-- Five figures that reconcile: opening + contributed + transferred in − withdrawn = balance.
           A member checking the arithmetic is exactly who this row is for. -->
      <div
        class="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5"
      >
        <div
          v-for="cell in [
            { label: `Opening · ${passbook.openingLabel}`, value: passbook.opening, sign: '' },
            { label: 'Contributed', value: passbook.contributed, sign: '+ ' },
            { label: 'Transferred in', value: passbook.transferredIn, sign: '+ ' },
            { label: 'Withdrawn', value: passbook.withdrawn, sign: '− ' },
          ]"
          :key="cell.label"
          class="flex flex-col gap-1 bg-surface px-[18px] py-4"
        >
          <p class="eyebrow eyebrow-faint">{{ cell.label }}</p>
          <p class="tabular text-[19px] font-semibold">{{ cell.sign }}₹{{ money(cell.value) }}</p>
        </div>
        <div class="flex flex-col gap-1 bg-brand-50 px-[18px] py-4">
          <p class="eyebrow" style="color: var(--color-brand-700)">
            Balance · {{ passbook.closingLabel }}
          </p>
          <p class="tabular text-[19px] font-semibold" style="color: oklch(0.375 0.14 25)">
            ₹{{ money(passbook.closing) }}
          </p>
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto rounded-card border border-border bg-surface">
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
            <p class="text-[13.5px] font-semibold">Balance on {{ displayDate(passbook.closingDate) }}</p>
            <p class="tabular text-right text-[13.5px] text-ink-faint">—</p>
            <p class="tabular text-right text-[14.5px] font-semibold">{{ money(passbook.totals.member) }}</p>
            <p class="tabular text-right text-[14.5px] font-semibold">{{ money(passbook.totals.company) }}</p>
            <p class="tabular text-right text-[14.5px] font-semibold">{{ money(passbook.totals.vpf) }}</p>
            <p class="tabular text-right text-[13.5px] text-ink-faintest">—</p>
            <p class="tabular text-right text-[14.5px] font-semibold">{{ money(passbook.closing) }}</p>
            <p />
          </div>
        </div>
      </div>

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
