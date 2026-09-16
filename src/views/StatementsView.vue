<script setup>
import { computed, onMounted, ref } from 'vue'
import * as me from '@/api/me'
import { displayDate, financialYear } from '@/composables/useFormat'
import { useDownload } from '@/composables/useDownload'
import AppBanner from '@/components/ui/AppBanner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

/**
 * The documents the trust issues a member, as PDFs.
 *
 * Every row here is one the API will serve: the list comes from GET /statements, which offers only
 * published annual statements, years the member contributed in, and a loan history when there is a paid
 * advance to list. So a download that fails is the trust's problem, and says so.
 *
 * No job card. The brief drew one because statements were assumed slow; they render in about a tenth of
 * a second, so the button is busy for a moment and the file saves.
 */
const statements = ref(null)
const loadFailed = ref(false)
const { busy, failure, download } = useDownload()

onMounted(async () => {
  try {
    statements.value = await me.getStatements()
  } catch {
    loadFailed.value = true
  }
})

const empty = computed(
  () =>
    statements.value &&
    !statements.value.annual.length &&
    !statements.value.monthly.length &&
    !statements.value.loanHistory,
)
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-col gap-1.5">
      <h1 class="font-display text-[30px] leading-[1.15]">Statements</h1>
      <p class="max-w-[72ch] text-sm leading-relaxed text-ink-muted">
        The documents the trust issues you, as PDFs, made from the same records the PF department works from.
      </p>
    </header>

    <AppBanner v-if="failure" tone="danger" title="That download did not work">{{ failure }}</AppBanner>
    <AppBanner v-if="loadFailed" tone="danger" title="Your statements could not be loaded">
      Try again in a moment. If it keeps happening, raise a query from Help.
    </AppBanner>

    <template v-if="statements">
      <EmptyState v-if="empty" title="No statements yet">
        Your first statement appears once a contribution has been recorded against your PF account, usually in
        the month after you join.
      </EmptyState>

      <section
        v-if="statements.annual.length"
        class="rounded-card border border-border bg-surface px-6 py-[22px]"
      >
        <h2 class="eyebrow mb-1">Annual statements</h2>
        <p class="mb-2 text-[13px] text-ink-muted">Issued once the trust has closed the year and credited interest.</p>
        <ul class="flex flex-col">
          <li
            v-for="entry in statements.annual"
            :key="`annual-${entry.year}`"
            class="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle py-3 last:border-0"
          >
            <div>
              <p class="text-sm font-semibold">{{ financialYear(entry.year) }}</p>
              <p class="tabular text-[12px] text-ink-faint">Published {{ displayDate(entry.publishedOn) }}</p>
            </div>
            <AppButton
              variant="secondary"
              size="md"
              :loading="busy === `annual-${entry.year}`"
              :disabled="busy !== null"
              @click="download(`annual-${entry.year}`, () => me.getAnnualStatement(entry.year))"
            >
              <AppIcon name="download" :size="15" />
              Download
            </AppButton>
          </li>
        </ul>
      </section>

      <section
        v-if="statements.monthly.length"
        class="rounded-card border border-border bg-surface px-6 py-[22px]"
      >
        <h2 class="eyebrow mb-1">Monthly statements</h2>
        <p class="mb-2 text-[13px] text-ink-muted">Every contribution, withdrawal and transfer in a financial year.</p>
        <ul class="flex flex-col">
          <li
            v-for="entry in statements.monthly"
            :key="`monthly-${entry.year}`"
            class="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle py-3 last:border-0"
          >
            <p class="text-sm font-semibold">
              {{ financialYear(entry.year) }}
              <span v-if="entry.inProgress" class="ml-1.5 text-[12px] font-normal text-ink-faint">so far</span>
            </p>
            <AppButton
              variant="secondary"
              size="md"
              :loading="busy === `monthly-${entry.year}`"
              :disabled="busy !== null"
              @click="download(`monthly-${entry.year}`, () => me.getMonthlyStatement(entry.year))"
            >
              <AppIcon name="download" :size="15" />
              Download
            </AppButton>
          </li>
        </ul>
      </section>

      <section v-if="statements.loanHistory" class="rounded-card border border-border bg-surface px-6 py-[22px]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="eyebrow mb-1">Loan history</h2>
            <p class="text-[13px] text-ink-muted">Every advance the trust has paid you, on one sheet.</p>
          </div>
          <AppButton
            variant="secondary"
            size="md"
            :loading="busy === 'loan-history'"
            :disabled="busy !== null"
            @click="download('loan-history', () => me.getLoanHistory())"
          >
            <AppIcon name="download" :size="15" />
            Download
          </AppButton>
        </div>
      </section>
    </template>

    <div v-else-if="!loadFailed" class="h-64 animate-pulse rounded-card bg-surface-deep" />
  </div>
</template>
