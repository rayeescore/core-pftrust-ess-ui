<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import * as me from '@/api/me'
import { displayDate, money } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import VerticalTracker from '@/components/product/VerticalTracker.vue'

/**
 * One transfer-in, and where it has got to.
 *
 * Three steps, not a loan's four: the PF department accepts it, writes to the other fund, and credits
 * the account when Annexure K arrives. The note under the tracker is the line that stops a quiet
 * three months becoming a phone call.
 */
const route = useRoute()
const transferIn = ref(null)
const failed = ref('')

onMounted(async () => {
  try {
    transferIn.value = await me.getTransferIn(route.params.id)
  } catch (failure) {
    failed.value = failure.response?.data?.message ?? 'This request could not be loaded.'
  }
})

/**
 * Opens a document in a new tab. Fetched through the authenticated client and handed over as an object
 * URL: a plain link would carry no Authorization header and land on a 401.
 */
async function open(kind) {
  try {
    const blob = await me.getTransferInDocument(route.params.id, kind)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (failure) {
    failed.value = failure.response?.data?.message ?? 'Could not open that document. Try again in a moment.'
  }
}
</script>

<template>
  <div v-if="transferIn" class="flex flex-col gap-5">
    <nav class="flex items-center gap-2 text-[12.5px] text-ink-faint">
      <RouterLink to="/transfer-in" class="hover:text-ink">Transfer in</RouterLink>
      <AppIcon name="chevronRight" :size="12" />
      <span class="font-mono">{{ transferIn.reference }}</span>
    </nav>

    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <h1 class="font-display text-[30px] leading-[1.15]">{{ transferIn.employer ?? 'Previous employer' }}</h1>
        <p class="flex flex-wrap items-center gap-2.5 text-[12.5px] text-ink-muted">
          <span class="font-mono">{{ transferIn.reference }}</span>
          <span class="size-[3px] rounded-full bg-border-strong" />
          <span class="tabular">Asked {{ displayDate(transferIn.appliedOn) }}</span>
        </p>
      </div>
      <StatusChip :label="transferIn.status.label" :tone="transferIn.status.tone" />
    </header>

    <section class="rounded-card border border-border bg-surface px-6 py-[22px]">
      <VerticalTracker v-if="transferIn.completedSteps > 0" :steps="transferIn.steps" />
      <p
        v-if="transferIn.note"
        class="mt-2 rounded-xl bg-surface-sub px-4 py-3.5 text-[13px] leading-[1.6] text-ink-soft"
      >
        {{ transferIn.note }}
      </p>
    </section>

    <p v-if="failed" class="text-[12.5px] text-danger-700" role="alert">{{ failed }}</p>

    <div class="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section class="rounded-card border border-border bg-surface px-6 py-[22px]">
        <h2 class="eyebrow mb-3">What you told the trust</h2>
        <dl class="flex flex-col">
          <div
            v-for="row in transferIn.details"
            :key="row.label"
            class="flex items-baseline justify-between gap-4 border-b border-border-subtle py-2.5 text-[13.5px] last:border-0"
          >
            <dt class="text-ink-muted">{{ row.label }}</dt>
            <dd class="text-right">{{ row.label.startsWith('You ') ? displayDate(row.value) : row.value }}</dd>
          </div>
        </dl>
        <p class="mt-3 text-[12.5px] leading-[1.55] text-ink-faint">
          Something wrong? Ask from
          <RouterLink to="/help" class="font-medium text-brand-700">Help</RouterLink> and the PF department
          will correct it.
        </p>
      </section>

      <aside class="flex flex-col gap-5">
        <section v-if="transferIn.amounts" class="rounded-card border border-border bg-surface px-5 py-5">
          <h2 class="eyebrow mb-3">Credited to your account</h2>
          <dl class="flex flex-col gap-2 text-[13.5px]">
            <div class="flex justify-between gap-4">
              <dt class="text-ink-muted">Your contribution</dt>
              <dd class="tabular">₹{{ money(transferIn.amounts.member) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink-muted">Employer’s contribution</dt>
              <dd class="tabular">₹{{ money(transferIn.amounts.company) }}</dd>
            </div>
          </dl>
        </section>

        <section
          v-if="transferIn.documents.annexureK || transferIn.documents.dispatchLetter"
          class="rounded-card border border-border bg-surface px-5 py-5"
        >
          <h2 class="eyebrow mb-3">Documents</h2>
          <button
            v-if="transferIn.documents.annexureK"
            class="block text-[13px] font-medium text-brand-700 hover:text-brand-600"
            @click="open('annexure-k')"
          >
            Annexure K
          </button>
          <button
            v-if="transferIn.documents.dispatchLetter"
            class="mt-2 block text-[13px] font-medium text-brand-700 hover:text-brand-600"
            @click="open('dispatch-letter')"
          >
            Dispatch letter
          </button>
        </section>
      </aside>
    </div>
  </div>

  <p v-else-if="failed" class="text-sm text-danger-700" role="alert">{{ failed }}</p>
  <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
</template>
