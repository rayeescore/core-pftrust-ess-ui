<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import * as me from '@/api/me'
import { displayDate, money } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import VerticalTracker from '@/components/product/VerticalTracker.vue'

/**
 * One advance, and where it has got to.
 *
 * The line that does the most work here is "Nothing is needed from you." A member watching an
 * application sit at the same step for a fortnight assumes they have missed something; saying plainly
 * that the wait is the trust's, and why there are two approvals, is what stops that becoming a phone
 * call.
 *
 * The rejected panel is drawn but cannot say much yet: **only transfer-in stores a rejection reason.**
 * Loans and settlements have nowhere to put one, so until a field is added this reads as a dead end
 * with a pointer to the PF department.
 */
const route = useRoute()
const loan = ref(null)

onMounted(async () => {
  loan.value = await me.getLoan(route.params.id)
})
</script>

<template>
  <div v-if="loan" class="flex flex-col gap-5">
    <nav class="flex items-center gap-2 text-[12.5px] text-ink-faint">
      <RouterLink to="/loans" class="hover:text-ink">Loans &amp; advances</RouterLink>
      <AppIcon name="chevronRight" :size="12" />
      <span class="font-mono">{{ loan.reference }}</span>
    </nav>

    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <h1 class="font-display text-[30px] leading-[1.15]">{{ loan.title }}</h1>
        <p class="flex flex-wrap items-center gap-2.5 text-[12.5px] text-ink-muted">
          <span class="font-mono">{{ loan.reference }}</span>
          <span class="size-[3px] rounded-full bg-border-strong" />
          <span class="tabular">Applied {{ displayDate(loan.appliedOn) }}</span>
        </p>
      </div>
      <StatusChip :label="loan.status.label" :tone="loan.status.tone" />
    </header>

    <!-- TRACKER -->
    <section class="rounded-card border border-border bg-surface px-6 py-[22px]">
      <VerticalTracker :steps="loan.steps" />

      <p
        v-if="loan.reassurance"
        class="mt-2 rounded-xl bg-surface-sub px-4 py-3.5 text-[13px] leading-[1.6] text-ink-soft"
      >
        <span class="font-semibold text-ink">Nothing is needed from you.</span>
        {{ loan.reassurance }}
      </p>
    </section>

    <div class="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div class="flex flex-col gap-5">
        <section class="rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow mb-3">The advance</h2>
          <dl class="flex flex-col">
            <div
              v-for="row in loan.summary"
              :key="row.label"
              class="flex items-baseline justify-between gap-4 border-b border-border-subtle py-2.5 text-[13.5px] last:border-0"
            >
              <dt class="text-ink-muted">{{ row.label }}</dt>
              <dd :class="[row.strong ? 'font-semibold' : '', row.numeric ? 'tabular' : '']">
                {{ row.numeric ? `₹${money(row.value)}` : row.value }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow mb-3">Documents you sent</h2>
          <ul class="flex flex-col">
            <li
              v-for="doc in loan.documents"
              :key="doc"
              class="flex items-center justify-between gap-4 border-b border-border-subtle py-2.5 text-[13.5px] last:border-0"
            >
              <span class="flex items-center gap-2.5">
                <AppIcon name="file" :size="15" class="text-ink-faint" />
                {{ doc }}
              </span>
              <button class="text-[12.5px] font-medium text-brand-700 hover:text-brand-600">View</button>
            </li>
          </ul>
        </section>
      </div>

      <aside class="flex flex-col gap-5">
        <section class="rounded-card border border-border bg-surface px-5 py-5">
          <h2 class="eyebrow mb-3">History</h2>
          <ol class="flex flex-col gap-3">
            <li v-for="entry in loan.history" :key="entry.at" class="flex gap-3">
              <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-border-strong" />
              <div>
                <p class="text-[13px]">{{ entry.label }}</p>
                <p class="tabular text-[11.5px] text-ink-faint">{{ entry.at }}</p>
              </div>
            </li>
          </ol>
        </section>

        <!-- The blocking rule, said before a member discovers it by being refused. -->
        <section class="rounded-card border border-border bg-surface-deep px-5 py-5">
          <h2 class="eyebrow">While this is open</h2>
          <p class="mt-2 text-[13px] leading-[1.55] text-ink-soft">
            You cannot start another advance, for any purpose, until this one is settled or withdrawn.
          </p>
          <button class="mt-3 text-[13px] font-semibold text-danger-700 hover:text-danger-500">
            Withdraw this application
          </button>
        </section>
      </aside>
    </div>
  </div>

  <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
</template>
