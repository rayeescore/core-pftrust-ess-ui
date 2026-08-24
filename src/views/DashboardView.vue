<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import * as me from '@/api/me'
import { displayDate, financialYear, money } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import ApplicationProgress from '@/components/product/ApplicationProgress.vue'
import BalanceBucketCard from '@/components/product/BalanceBucketCard.vue'
import BalanceBucketLegend from '@/components/product/BalanceBucketLegend.vue'
import ContributionYearChart from '@/components/product/ContributionYearChart.vue'

/**
 * The one screen most members will ever see.
 *
 * Each section loads and fails independently, which is why there are separate refs rather than one
 * `loading` flag: a balance that does not arrive must not take the page down with it. Everything else
 * on the page is still true and still useful.
 */
const identity = ref(null)
const balance = ref(null)
const balanceFailed = ref(false)
const applications = ref(null)
const alerts = ref([])

onMounted(() => {
  me.getIdentity().then((data) => (identity.value = data))

  me.getBalance()
    .then((data) => (balance.value = data))
    .catch(() => (balanceFailed.value = true))

  // Two of these handlers are Phase 3. A section whose call fails shows its own empty state rather than
  // leaving a skeleton spinning, which is what an uncaught rejection would do.
  me.getActiveApplications()
    .then((data) => (applications.value = data))
    .catch(() => (applications.value = []))

  me.getAlerts()
    .then((data) => (alerts.value = data))
    .catch(() => (alerts.value = []))
})

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** The identity meta line, as separate spans so the dot separators are drawn rather than typed. */
const identityParts = (member) => {
  const parts = []
  if (member.pfNumber) parts.push({ mono: true, text: `PF ${member.pfNumber}` })
  if (member.pernNumber) parts.push({ mono: true, text: `PERN ${member.pernNumber}` })
  if (member.uanNumber) parts.push({ mono: true, text: `UAN ${member.uanNumber}` })
  if (member.unitCode) {
    parts.push({
      mono: false,
      text: member.location ? `Unit ${member.unitCode} · ${member.location}` : `Unit ${member.unitCode}`,
    })
  }
  return parts
}

const buckets = [
  { key: 'member', title: 'Your contribution' },
  { key: 'company', title: 'Company contribution' },
  { key: 'vpf', title: 'Voluntary (VPF)' },
]

const quickActions = [
  { to: '/loans', label: 'Apply for an advance', icon: 'plus' },
  { to: '/pf/statements', label: 'Download a statement', icon: 'download' },
  { to: '/profile', label: 'Update my details', icon: 'edit' },
  { to: '/help', label: 'Raise a query', icon: 'help' },
]
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- IDENTITY -->
    <section class="flex flex-wrap items-end justify-between gap-4">
      <div v-if="identity" class="flex flex-col gap-[7px]">
        <h1 class="font-display text-[30px] leading-[1.15]">
          {{ greeting() }}, {{ identity.name.split(' ')[0] }}
        </h1>
        <div class="flex flex-wrap items-center gap-2.5">
          <template v-for="(part, index) in identityParts(identity)" :key="part.text">
            <span
              class="text-[12.5px] text-ink-muted"
              :class="part.mono ? 'font-mono' : ''"
            >{{ part.text }}</span>
            <span
              v-if="index < identityParts(identity).length - 1"
              class="size-[3px] rounded-full bg-border-strong"
            />
          </template>
        </div>
      </div>
      <div v-else class="flex flex-col gap-2">
        <div class="h-9 w-72 animate-pulse rounded-md bg-surface-deep" />
        <div class="h-4 w-96 animate-pulse rounded bg-surface-deep" />
      </div>

      <StatusChip v-if="identity" :label="identity.statusLabel" :tone="identity.statusTone" />
    </section>

    <!-- ALERTS -->
    <section
      v-for="alert in alerts"
      :key="alert.title"
      class="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 px-[17px] py-[13px]"
    >
      <AppIcon name="warning" :size="18" class="text-warning-500" />
      <p class="flex-1 text-[13.5px] leading-relaxed text-warning-700">
        <span class="font-semibold">{{ alert.title }}</span> {{ alert.body }}
      </p>
      <RouterLink
        :to="alert.to"
        class="shrink-0 text-[13px] font-semibold text-brand-700 hover:text-brand-600"
      >
        {{ alert.actionLabel }} →
      </RouterLink>
    </section>

    <!-- BALANCE + BUCKETS -->
    <section class="flex flex-col gap-[22px] rounded-card border border-border bg-surface px-7 py-[26px]">
      <div class="flex flex-wrap items-start justify-between gap-6">
        <div class="flex flex-col gap-2">
          <p class="eyebrow">Your provident fund balance</p>

          <template v-if="balance">
            <MoneyDisplay :amount="balance.total" size="display" />
            <!--
              Honest about staleness, in one line. Contributions are imported from SAP monthly and
              interest is credited once at year end, so this figure is never live -- and a member who is
              not told that reads a month-old number as today's.
            -->
            <p class="max-w-[58ch] text-[13px] leading-[1.55] text-ink-muted">
              As on
              <span class="tabular font-semibold text-ink">{{ displayDate(balance.asOn) }}</span
              >, the last month posted. Contributions arrive monthly from payroll; interest is credited
              once, at year end — so this figure is not live.
            </p>
          </template>

          <!-- A failed balance shows its own error and leaves the rest of the page standing. -->
          <template v-else-if="balanceFailed">
            <p class="mt-1 text-[15px] font-semibold">We could not load your balance</p>
            <p class="max-w-[58ch] text-[13px] leading-[1.55] text-ink-muted">
              Nothing is wrong with your account — the figure just did not reach us. Everything else on
              this page is up to date.
            </p>
            <button
              class="mt-1 w-fit rounded-md border border-border px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-surface-sub"
              @click="$router.go(0)"
            >
              Try again
            </button>
          </template>

          <div v-else class="h-14 w-72 animate-pulse rounded-md bg-surface-deep" />
        </div>

        <div v-if="balance" class="flex shrink-0 flex-col items-end gap-1 pt-1">
          <p class="eyebrow eyebrow-faint">Last recovery</p>
          <p class="tabular text-[15px] font-medium">{{ displayDate(balance.lastRecoveryDate) }}</p>
          <p class="tabular text-[12.5px] text-ink-faint">PF base ₹{{ money(balance.pfBase) }}</p>
        </div>
      </div>

      <!--
        Nested inside the balance card: these are one figure broken down, not three separate facts.

        Three cards where there is room; a legend on a phone, where three stacked cards would push the
        rest of the dashboard below two screens of scrolling. Not a reflow of the same markup, because
        it is a different reading of the same data -- see BalanceBucketLegend.
      -->
      <template v-if="balance">
        <div class="hidden gap-3.5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          <BalanceBucketCard
            v-for="bucket in buckets"
            :key="bucket.key"
            :title="bucket.title"
            v-bind="balance.buckets[bucket.key]"
          />
        </div>
        <BalanceBucketLegend :buckets="balance.buckets" class="sm:hidden" />
      </template>
    </section>

    <!-- THIS FINANCIAL YEAR -->
    <section
      v-if="balance"
      class="flex flex-col gap-[18px] rounded-card border border-border bg-surface px-7 pt-[22px] pb-6"
    >
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div class="flex items-baseline gap-3.5">
          <h2 class="text-[17px] font-semibold">This financial year</h2>
          <p class="text-[13px] text-ink-muted">
            {{ financialYear(balance.financialYear.endingYear) }} · April to March
          </p>
        </div>
        <RouterLink to="/pf" class="text-[13px] font-semibold text-brand-700 hover:text-brand-600">
          Open passbook →
        </RouterLink>
      </div>

      <dl class="flex flex-wrap gap-x-[34px] gap-y-4">
        <div class="flex shrink-0 flex-col gap-[3px]">
          <dt class="eyebrow eyebrow-faint">Credited so far</dt>
          <dd><MoneyDisplay :amount="balance.financialYear.creditedSoFar" size="lg" /></dd>
        </div>
        <div class="flex shrink-0 flex-col gap-[3px]">
          <dt class="eyebrow eyebrow-faint">Months posted</dt>
          <dd class="tabular text-2xl font-semibold">
            {{ balance.financialYear.monthsPosted }}
            <span class="text-[15px] font-normal text-ink-faint">
              of {{ balance.financialYear.monthsInYear }}
            </span>
          </dd>
        </div>
        <div class="flex shrink-0 flex-col gap-[3px]">
          <dt class="eyebrow eyebrow-faint">Rate last credited</dt>
          <!--
            Labelled with the year it belongs to, not the year the member is in. Interest for the
            current year has not been worked out yet, and a bare "8.25%" here would say it has.
          -->
          <dd class="tabular text-2xl font-semibold">
            {{ balance.financialYear.rateLastCredited
            }}<span class="text-[15px] font-normal text-ink-faint">
              % · {{ financialYear(balance.financialYear.rateForYearEnding) }}
            </span>
          </dd>
        </div>
      </dl>

      <ContributionYearChart :months-posted="balance.financialYear.monthsPosted" />
    </section>

    <!-- IN PROGRESS + RIGHT COLUMN -->
    <section class="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
      <div class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
        <div class="flex items-baseline justify-between">
          <h2 class="text-[17px] font-semibold">In progress</h2>
          <p v-if="applications?.length" class="text-[13px] text-ink-faint">
            {{ applications.length }} application{{ applications.length === 1 ? '' : 's' }}
          </p>
        </div>

        <div v-if="applications === null" class="h-32 animate-pulse rounded-xl bg-surface-deep" />

        <div
          v-else-if="applications.length === 0"
          class="rounded-xl border border-dashed border-border px-6 py-9 text-center"
        >
          <p class="text-sm font-semibold">No applications in progress</p>
          <p class="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">
            When you apply for an advance it will appear here with its progress.
          </p>
          <RouterLink
            to="/loans"
            class="mt-3 inline-block text-[13px] font-semibold text-brand-700 hover:text-brand-600"
          >
            See what you are eligible for →
          </RouterLink>
        </div>

        <article
          v-for="application in applications ?? []"
          :key="application.id"
          class="flex flex-col gap-3.5 rounded-xl border border-border px-[18px] py-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col gap-[3px]">
              <h3 class="text-[14.5px] font-semibold">{{ application.title }}</h3>
              <p class="font-mono text-[11.5px] text-ink-faint">{{ application.reference }}</p>
            </div>
            <StatusChip :label="application.status.label" :tone="application.status.tone" />
          </div>

          <ApplicationProgress :completed="application.completedSteps" />

          <div class="flex flex-wrap items-end justify-between gap-4">
            <p class="flex-1 text-[12.5px] leading-[1.5] text-ink-muted">{{ application.note }}</p>
            <div v-if="application.amount" class="flex shrink-0 flex-col items-end gap-px">
              <p class="text-[11px] text-ink-faint">{{ application.amountLabel }}</p>
              <MoneyDisplay :amount="application.amount" size="sm" />
            </div>
          </div>
        </article>
      </div>

      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="mb-0.5 text-[17px] font-semibold">Quick actions</h2>
          <RouterLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="flex items-center gap-3 rounded-[10px] border border-border px-[15px] py-[13px] transition-colors hover:bg-surface-sub"
          >
            <AppIcon :name="action.icon" :size="18" class="text-brand-600" />
            <span class="flex-1 text-sm font-medium">{{ action.label }}</span>
            <AppIcon name="chevronRight" :size="15" class="text-ink-faint" />
          </RouterLink>
        </div>

        <div
          class="flex flex-col gap-[9px] rounded-card border border-border bg-surface-deep px-[22px] py-5"
        >
          <p class="eyebrow">Statements</p>
          <p class="text-[13.5px] leading-[1.55] text-ink-soft">
            Your annual statement for
            <span class="font-semibold text-ink">{{ financialYear(2026) }}</span> is published and
            ready.
          </p>
          <RouterLink
            to="/pf/statements"
            class="pt-0.5 text-[13px] font-semibold text-brand-700 hover:text-brand-600"
          >
            Download PDF →
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
