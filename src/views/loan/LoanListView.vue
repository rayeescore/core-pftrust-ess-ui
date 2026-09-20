<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import * as me from '@/api/me'
import { displayDate } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import ApplicationProgress from '@/components/product/ApplicationProgress.vue'

/**
 * Every advance the member has ever applied for.
 *
 * The screen the rail's "Loans & advances" has pointed at since the shell was built. It reads
 * GET /api/v1/me/loans, which takes no parameter at all: there is no such thing as somebody else's
 * list to ask for.
 *
 * The card carries no amount, deliberately. MemberLoanRecord exposes its figures only inside a
 * `summary` array shaped for display, and mining that for "the one marked strong" is a coupling that
 * would break the day somebody reorders the rows. The detail screen shows all four figures with the
 * labels that make them mean something; a list is for finding the right application, not reading it.
 *
 * Each row owns its own state through the shared `failed` ref rather than a spinner over the page --
 * a list that fails should say so where the list is, and leave the rail and the header alone.
 */
const loans = ref(null)
const failed = ref(false)

onMounted(async () => {
  try {
    loans.value = await me.getLoans()
  } catch {
    failed.value = true
  }
})

/** The rejected branch is drawn differently: the bar goes red from where it stopped. */
function isRejected(loan) {
  return loan.status?.tone === 'danger'
}
</script>

<template>
  <div class="flex flex-col gap-[22px]">
    <header class="flex flex-wrap items-end justify-between gap-7">
      <div class="flex flex-col gap-[7px]">
        <h1 class="font-display text-[25px] leading-[1.15] sm:text-[30px]">Your advances</h1>
        <p class="text-[13.5px] text-ink-muted">
          Everything you have applied for, and where each one has got to.
        </p>
      </div>

      <RouterLink
        to="/loans/apply"
        class="flex min-h-11 shrink-0 items-center gap-[9px] rounded-[10px] bg-action-fill px-[18px] py-[11px] text-sm font-semibold text-on-brand transition-colors hover:bg-brand-600"
      >
        <AppIcon name="plus" :size="16" />
        Apply for an advance
      </RouterLink>
    </header>

    <p
      v-if="failed"
      class="rounded-card border border-danger-200 bg-danger-50 px-6 py-5 text-sm leading-relaxed"
    >
      We could not load your advances just now. Refresh the page, and if it keeps happening raise a
      query from Help &amp; queries — nothing about your applications has changed.
    </p>

    <div v-else-if="loans === null" class="flex flex-col gap-3">
      <div v-for="n in 3" :key="n" class="h-[104px] animate-pulse rounded-card bg-surface-deep" />
    </div>

    <EmptyState v-else-if="loans.length === 0" title="You have not applied for an advance">
      An advance is money taken permanently from your provident fund for a specific purpose — a house,
      a marriage, medical treatment, a child's education. It is not a loan and it is not repaid.
      <template #action>
        <RouterLink
          to="/loans/apply"
          class="text-[13px] font-semibold text-brand-700 hover:text-brand-600"
        >
          See what you are eligible for →
        </RouterLink>
      </template>
    </EmptyState>

    <ul v-else class="flex flex-col gap-3">
      <li v-for="loan in loans" :key="loan.id">
        <RouterLink
          :to="`/loans/${loan.id}`"
          class="flex flex-col gap-3.5 rounded-card border border-border bg-surface px-[22px] py-[18px] transition-colors hover:bg-surface-sub"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-[15px] font-semibold">{{ loan.title }}</span>
              <span class="font-mono text-[11.5px] text-ink-faint">{{ loan.reference }}</span>
            </div>
            <StatusChip :label="loan.status.label" :tone="loan.status.tone" />
          </div>

          <ApplicationProgress
            :completed="loan.completedSteps"
            :rejected="isRejected(loan)"
            :current="!isRejected(loan)"
          />

          <p class="text-[12.5px] text-ink-faint">
            Applied {{ displayDate(loan.appliedOn) }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
