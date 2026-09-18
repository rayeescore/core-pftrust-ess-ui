<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import * as me from '@/api/me'
import { downloadFailure, saveFile } from '@/composables/useDownload'
import { displayDate, money } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import VerticalTracker from '@/components/product/VerticalTracker.vue'

/**
 * One claim and where it has got to. The amount appears once the PF department has accepted the claim and
 * worked it out with the settlement date — not before, because until then there is no date to work it to.
 */
const route = useRoute()
const claim = ref(null)
const failed = ref('')

onMounted(async () => {
  try {
    claim.value = await me.getClaim(route.params.id)
  } catch (failure) {
    failed.value = failure.response?.data?.message ?? 'This claim could not be loaded.'
  }
})

/**
 * Saves a document the member sent with their claim.
 *
 * Fetched through the authenticated client, never a plain <a href> -- the API is bearer-only, so a
 * link would land on a 401 in a blank tab. Saved rather than opened in a new tab: by the time the
 * request returns, the click's user activation has usually lapsed and a popup blocker may refuse it.
 */
async function save(documentId) {
  failed.value = ''
  try {
    const { blob, filename } = await me.getDocumentFile(documentId)
    saveFile(blob, filename)
  } catch (error) {
    failed.value = await downloadFailure(error)
  }
}
</script>

<template>
  <div v-if="claim" class="flex flex-col gap-5">
    <nav class="flex items-center gap-2 text-[12.5px] text-ink-faint">
      <RouterLink to="/claims" class="hover:text-ink">Leaving &amp; claims</RouterLink>
      <AppIcon name="chevronRight" :size="12" />
      <span class="font-mono">{{ claim.reference }}</span>
    </nav>

    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <h1 class="font-display text-[25px] leading-[1.15] sm:text-[30px]">{{ claim.title }}</h1>
        <p class="flex flex-wrap items-center gap-2.5 text-[12.5px] text-ink-muted">
          <span class="font-mono">{{ claim.reference }}</span>
          <template v-if="claim.appliedOn">
            <span class="size-[3px] rounded-full bg-border-strong" />
            <span class="tabular">Raised {{ displayDate(claim.appliedOn) }}</span>
          </template>
        </p>
      </div>
      <StatusChip :label="claim.status.label" :tone="claim.status.tone" />
    </header>

    <section class="rounded-card border border-border bg-surface px-6 py-[22px]">
      <VerticalTracker v-if="claim.status.label !== 'Rejected'" :steps="claim.steps" />
      <p v-if="claim.note" class="mt-2 rounded-xl bg-surface-sub px-4 py-3.5 text-[13px] leading-[1.6] text-ink-soft">
        {{ claim.note }}
      </p>
    </section>

    <p v-if="failed" class="text-[12.5px] text-danger-700" role="alert">{{ failed }}</p>

    <div class="grid items-start gap-5 *:min-w-0 lg:grid-cols-[1.4fr_1fr]">
      <section class="rounded-card border border-border bg-surface px-6 py-[22px]">
        <h2 class="eyebrow mb-3">Your claim</h2>
        <dl class="flex flex-col">
          <div
            v-for="row in claim.details"
            :key="row.label"
            class="flex items-baseline justify-between gap-4 border-b border-border-subtle py-2.5 text-[13.5px] last:border-0"
          >
            <dt class="text-ink-muted">{{ row.label }}</dt>
            <dd class="text-right">{{ row.label === 'Last working day' ? displayDate(row.value) : row.value }}</dd>
          </div>
        </dl>
      </section>

      <aside class="flex flex-col gap-5">
        <section v-if="claim.amount" class="overflow-hidden rounded-card border border-brand-100 bg-brand-50 px-5 py-5">
          <p class="text-[13px] font-medium" style="color: var(--color-brand-700)">{{ claim.amount.label }}</p>
          <p class="tabular mt-1.5 font-display text-[32px] leading-[1.1]" style="color: oklch(0.375 0.14 25)">
            ₹{{ money(claim.amount.value) }}
          </p>
          <p class="mt-1.5 text-xs leading-[1.5]" style="color: var(--color-brand-700)">
            Worked out by the PF department on the settlement date.
          </p>
        </section>

        <section v-if="claim.documents?.length" class="rounded-card border border-border bg-surface px-5 py-5">
          <h2 class="eyebrow mb-1">Documents you sent</h2>
          <button
            v-for="doc in claim.documents"
            :key="doc.id"
            type="button"
            class="mt-2 block min-h-11 text-left text-[13px] font-medium text-brand-700 hover:text-brand-600"
            @click="save(doc.id)"
          >
            {{ doc.name }}
          </button>
        </section>

        <section class="rounded-card border border-border bg-surface-deep px-5 py-5">
          <h2 class="eyebrow">Before it is paid</h2>
          <p class="mt-2 text-[13px] leading-[1.55] text-ink-soft">
            This account closes when the money is paid. Download statements and anything else you want to keep
            first.
          </p>
        </section>
      </aside>
    </div>
  </div>

  <p v-else-if="failed" class="text-sm text-danger-700" role="alert">{{ failed }}</p>
  <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
</template>
