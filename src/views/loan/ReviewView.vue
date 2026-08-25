<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLoanDraft } from '@/composables/useLoanDraft'
import { money } from '@/composables/useFormat'
import LoanFlowLayout from '@/layouts/LoanFlowLayout.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * Step 5: check it over.
 *
 * Every section carries a Change link back to the step that owns it. A review screen that can only be
 * corrected by pressing Back four times is a review screen people stop reading.
 *
 * The declaration is required, and its wording is deliberate: it says the advance is **taken
 * permanently from the provident fund and not repaid**. That sentence is the difference between a
 * member who understands what they are signing and one who does not.
 */
const router = useRouter()
const draft = useLoanDraft()
const submitting = ref(false)

const whatHappensNext = [
  {
    title: 'The PF department checks it',
    body: 'Usually within a week. They may come back for a clearer document.',
  },
  {
    title: 'A second person approves',
    body: 'Two different people must sign off on any advance. This is the step that usually takes longest.',
  },
  {
    title: 'The money is paid',
    body: 'Into the account shown above, and the advance appears in your passbook.',
  },
]

async function submit() {
  submitting.value = true
  // No create endpoint yet -- POST /api/v1/me/loans is Phase 3. Landing on the tracker is what a real
  // submission does, and it is the state worth being able to look at now.
  router.push('/loans/PFL-2026-27-00184')
}
</script>

<template>
  <LoanFlowLayout
    :step="5"
    title="Check it over"
    intro="Nothing is submitted until you press the button. After that it goes to the PF department and you can follow it from your dashboard."
    note="Once submitted you can withdraw the application at any time before it is paid."
    continue-label="Submit application"
    :can-continue="draft.declared && !submitting"
    @back="router.push('/loans/apply/documents')"
    @continue="submit"
  >
    <div class="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div class="flex flex-col gap-5">
        <section class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]">
          <div
            v-for="section in [
              { label: 'Purpose', to: '/loans/apply' },
              { label: 'Amount', to: '/loans/apply/amount' },
              { label: 'Paid into', to: '/loans/apply/details' },
              { label: 'Documents', to: '/loans/apply/documents' },
            ]"
            :key="section.label"
            class="flex flex-col gap-2"
          >
            <div class="flex items-baseline justify-between gap-3">
              <h2 class="eyebrow">{{ section.label }}</h2>
              <button
                class="text-[12.5px] font-medium text-brand-700 hover:text-brand-600"
                @click="router.push(section.to)"
              >
                Change
              </button>
            </div>

            <p v-if="section.label === 'Purpose'" class="text-[15px] font-medium">
              {{ draft.purpose?.title ?? 'Purchase of Residential House/Flat' }}
            </p>

            <dl v-else-if="section.label === 'Amount'" class="flex flex-col gap-1.5 text-[13.5px]">
              <div class="flex justify-between gap-4">
                <dt class="text-ink-muted">Total cost of the flat</dt>
                <dd class="tabular">₹{{ money(draft.totalCost) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-ink-muted">You asked for</dt>
                <dd class="tabular">₹{{ money(draft.requested) }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-t border-border pt-1.5 font-semibold">
                <dt>You will receive</dt>
                <dd class="tabular">₹{{ money('2780690') }}</dd>
              </div>
            </dl>

            <p v-else-if="section.label === 'Paid into'" class="text-[13.5px]">
              HDFC Bank, Nashik Road<br />
              <span class="font-mono text-xs text-ink-muted">••••••••4471 · HDFC0000521</span>
            </p>

            <ul v-else class="flex flex-col gap-1 text-[13.5px]">
              <li
                v-for="doc in ['Sale Agreement', 'Stamp Duty / Registration Receipt', 'Builders Receipt']"
                :key="doc"
                class="flex items-center gap-2"
              >
                <AppIcon name="check" :size="14" class="text-success-500" />
                {{ doc }}
              </li>
            </ul>
          </div>
        </section>

        <label
          class="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-4"
        >
          <input v-model="draft.declared" type="checkbox" class="mt-0.5 size-4 accent-[var(--color-brand-500)]" />
          <span class="text-[13px] leading-[1.6] text-ink-soft">
            I confirm the details above are true, that the advance is for the purpose stated, and that I
            understand it is
            <span class="font-semibold text-ink"
              >taken permanently from my provident fund and not repaid</span
            >.
          </span>
        </label>
      </div>

      <aside class="flex flex-col gap-4 rounded-card border border-border bg-surface px-5 py-5">
        <h2 class="eyebrow">What happens next</h2>
        <div v-for="(item, index) in whatHappensNext" :key="item.title" class="flex gap-3">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-deep text-[11px] font-semibold text-ink-muted"
          >
            {{ index + 1 }}
          </span>
          <div>
            <p class="text-[13.5px] font-medium">{{ item.title }}</p>
            <p class="mt-0.5 text-xs leading-[1.5] text-ink-muted">{{ item.body }}</p>
          </div>
        </div>
      </aside>
    </div>
  </LoanFlowLayout>
</template>
