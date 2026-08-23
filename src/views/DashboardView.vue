<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import * as me from '@/api/me'
import { displayDate, financialYear, money } from '@/composables/useFormat'
import AppBanner from '@/components/ui/AppBanner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import ApplicationTracker from '@/components/product/ApplicationTracker.vue'
import BalanceBucketCard from '@/components/product/BalanceBucketCard.vue'

/**
 * The one screen most members will ever see.
 *
 * Each section loads independently, which is the point of the separate refs below rather than one
 * `loading` flag: a balance that fails to load must not take the page down with it. Everything else is
 * still true and still useful, so the balance card shows its own error and the rest of the dashboard
 * carries on.
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

  me.getActiveApplications().then((data) => (applications.value = data))
  me.getAlerts().then((data) => (alerts.value = data))
})

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const buckets = [
  { key: 'member', title: 'Your contribution', subtitle: '12% of PF base' },
  { key: 'company', title: 'Company contribution', subtitle: '' },
  { key: 'vpf', title: 'Voluntary (VPF)', subtitle: '' },
]

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
</script>

<template>
  <div class="space-y-6">
    <!-- Identity strip -->
    <section>
      <div v-if="identity" class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 class="font-display text-2xl text-ink">
          {{ greeting() }}, {{ identity.name.split(' ')[0] }}
        </h1>
        <StatusChip
          :label="identity.contributionStatus.label"
          :tone="identity.contributionStatus.symbol === 'A' ? 'success' : 'warning'"
        />
      </div>
      <div v-else class="h-8 w-64 animate-pulse rounded-md bg-surface-deep" />

      <p v-if="identity" class="mt-1 font-mono text-xs text-ink-faint">
        PF {{ identity.pfNumber }} · PERN {{ identity.pernNumber }} · UAN {{ identity.uanNumber }} ·
        Unit {{ identity.unitCode }}, {{ identity.location }}
      </p>
    </section>

    <AppBanner v-for="alert in alerts" :key="alert.title" :tone="alert.tone" :title="alert.title">
      {{ alert.body }}
      <template #action>
        <RouterLink :to="alert.to" class="text-sm font-medium text-brand-600 hover:text-brand-700">
          {{ alert.actionLabel }} →
        </RouterLink>
      </template>
    </AppBanner>

    <!-- Balance headline -->
    <section class="rounded-card bg-surface p-6 ring-1 ring-border">
      <h2 class="text-sm font-medium text-ink-muted">Your provident fund balance</h2>

      <template v-if="balance">
        <div class="mt-2">
          <MoneyDisplay :amount="balance.total" size="display" />
        </div>

        <!--
          Honest about staleness, in one line. Contributions are imported from SAP monthly and interest is
          credited once at year end, so this figure is never live -- and a member who is not told that
          reads a month-old number as today's.
        -->
        <p class="mt-3 max-w-prose text-sm text-ink-muted">
          As on <strong class="font-medium text-ink">{{ displayDate(balance.asOn) }}</strong
          >, the last month posted. Contributions arrive monthly from payroll; interest is credited once,
          at year end — so this figure is not live.
        </p>

        <dl class="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-3 text-sm">
          <div class="flex gap-2">
            <dt class="text-ink-faint">Last recovery</dt>
            <dd class="font-medium">{{ displayDate(balance.lastRecoveryDate) }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-ink-faint">PF base</dt>
            <dd class="font-medium">₹{{ money(balance.pfBase) }}</dd>
          </div>
        </dl>
      </template>

      <!-- A failed balance shows its own error and leaves the rest of the page alone. -->
      <div v-else-if="balanceFailed" class="mt-3">
        <p class="text-sm font-semibold text-ink">We could not load your balance</p>
        <p class="mt-1 max-w-prose text-sm text-ink-muted">
          Nothing is wrong with your account — the figure just did not reach us. Everything else on this
          page is up to date.
        </p>
        <AppButton variant="secondary" size="sm" class="mt-3" @click="$router.go(0)">
          Try again
        </AppButton>
      </div>

      <div v-else class="mt-2 h-14 w-72 animate-pulse rounded-md bg-surface-deep" />
    </section>

    <!-- Three buckets -->
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <template v-if="balance">
        <BalanceBucketCard
          v-for="bucket in buckets"
          :key="bucket.key"
          :title="bucket.title"
          :subtitle="bucket.subtitle"
          v-bind="balance.buckets[bucket.key]"
        />
      </template>
      <div
        v-else
        v-for="n in 3"
        :key="n"
        class="h-44 animate-pulse rounded-card bg-surface-deep"
      />
    </section>

    <!-- This financial year -->
    <section v-if="balance" class="rounded-card bg-surface p-6 ring-1 ring-border">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-sm font-semibold text-ink">
          This financial year
          <span class="ml-1 font-normal text-ink-faint">
            {{ financialYear(balance.financialYear.endingYear) }} · April to March
          </span>
        </h2>
        <RouterLink to="/pf" class="text-sm font-medium text-brand-600 hover:text-brand-700">
          Open passbook →
        </RouterLink>
      </div>

      <dl class="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt class="text-xs text-ink-faint">Credited so far</dt>
          <dd class="mt-1"><MoneyDisplay :amount="balance.financialYear.creditedSoFar" /></dd>
        </div>
        <div>
          <dt class="text-xs text-ink-faint">Months posted</dt>
          <dd class="tabular mt-1 text-xl font-semibold">
            {{ balance.financialYear.monthsPosted }}
            <span class="text-sm font-normal text-ink-faint">
              of {{ balance.financialYear.monthsInYear }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="text-xs text-ink-faint">Rate last credited</dt>
          <!--
            The rate is labelled with the year it belongs to, not the year the member is in. Interest for
            the current year has not been worked out yet, and a bare "8.25%" here would say it has.
          -->
          <dd class="tabular mt-1 text-xl font-semibold">
            {{ balance.financialYear.rateLastCredited }}%
            <span class="text-sm font-normal text-ink-faint">
              · {{ financialYear(balance.financialYear.rateForYearEnding) }}
            </span>
          </dd>
        </div>
      </dl>

      <ol class="mt-5 flex gap-1.5" aria-label="Months posted this financial year">
        <li
          v-for="(month, index) in MONTHS"
          :key="month"
          class="flex-1 rounded-sm px-1 py-1.5 text-center text-[10px] font-medium"
          :class="
            index < balance.financialYear.monthsPosted
              ? 'bg-success-50 text-success-700'
              : 'bg-surface-deep text-ink-faint'
          "
        >
          {{ month }}
        </li>
      </ol>
    </section>

    <!-- Applications in progress -->
    <section>
      <h2 class="text-sm font-semibold text-ink">In progress</h2>

      <div v-if="applications === null" class="mt-3 h-32 animate-pulse rounded-card bg-surface-deep" />

      <EmptyState v-else-if="applications.length === 0" title="No applications in progress" class="mt-3">
        When you apply for an advance it will appear here with its progress.
        <template #action>
          <RouterLink to="/loans" class="text-sm font-medium text-brand-600 hover:text-brand-700">
            See what you are eligible for →
          </RouterLink>
        </template>
      </EmptyState>

      <div v-else class="mt-3 space-y-4">
        <article
          v-for="application in applications"
          :key="application.id"
          class="rounded-card bg-surface p-5 ring-1 ring-border"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-ink">{{ application.title }}</h3>
              <p class="mt-0.5 font-mono text-xs text-ink-faint">{{ application.reference }}</p>
            </div>
            <StatusChip :label="application.status.label" :tone="application.status.tone" />
          </div>

          <p class="mt-3 max-w-prose text-sm text-ink-muted">{{ application.note }}</p>

          <div v-if="application.amount" class="mt-3">
            <p class="text-xs text-ink-faint">{{ application.amountLabel }}</p>
            <MoneyDisplay :amount="application.amount" />
          </div>

          <div class="mt-5 border-t border-border pt-5">
            <ApplicationTracker :steps="application.steps" />
          </div>
        </article>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="no-print">
      <h2 class="text-sm font-semibold text-ink">Quick actions</h2>
      <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RouterLink
          v-for="action in [
            { to: '/loans', label: 'Apply for an advance' },
            { to: '/pf/statements', label: 'Download a statement' },
            { to: '/profile', label: 'Update my details' },
            { to: '/help', label: 'Raise a query' },
          ]"
          :key="action.to"
          :to="action.to"
          class="rounded-card bg-surface px-4 py-4 text-sm font-medium text-ink ring-1 ring-border hover:bg-surface-deep"
        >
          {{ action.label }}
        </RouterLink>
      </div>
    </section>
  </div>
</template>
