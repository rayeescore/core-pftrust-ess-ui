<script setup>
import { useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import { useLoanDraft } from '@/composables/useLoanDraft'
import { money } from '@/composables/useFormat'
import LoanFlowLayout from '@/layouts/LoanFlowLayout.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'

/**
 * Step 3: the details, and which of them are asked depends entirely on the purpose.
 *
 * A housing advance itemises the property; a marriage advance asks none of it. That conditionality is
 * the whole design of this step, and it is also the biggest gap between the design and the API: today
 * `POST /api/v1/loan` demands the property block AND a repayment-bank block for every purpose, and asks
 * the member for the trust's own paying bank and payment mode — which a member cannot possibly know.
 * All three need relaxing before this screen can be built as drawn.
 *
 * **Bank details are read-only here.** They come from the employee master, which is SAP-owned with no
 * update endpoint of any kind, and a wrong account on an advance is very hard to undo.
 */
const router = useRouter()
const draft = useLoanDraft()

const property = [
  { key: 'agreementValue', label: 'Agreement value', value: '4200000' },
  { key: 'stampDuty', label: 'Stamp duty', value: '252000' },
  { key: 'registration', label: 'Registration', value: '30000' },
  { key: 'insurance', label: 'Insurance', value: '18000' },
  { key: 'others', label: 'Anything else', value: '300000' },
]

const bank = [
  { label: 'Bank', value: 'HDFC Bank' },
  { label: 'Branch', value: 'Nashik Road' },
  { label: 'Account number', value: '••••••••4471', mono: true },
  { label: 'IFSC', value: 'HDFC0000521', mono: true },
]

const otherPurposes = [
  {
    title: 'Repayment of Housing Loan',
    body: 'Adds the lender’s name, branch, account and IFSC — the money goes to them, not to you.',
  },
  {
    title: 'Marriage, Education, Medical',
    body: 'No property block at all. Phone, email and your own bank account are the whole step.',
  },
  {
    title: 'Every purpose',
    body: 'The trust’s own paying bank and payment mode are chosen by the PF department later, never by you.',
  },
]
</script>

<template>
  <LoanFlowLayout
    :step="3"
    title="Tell us about the purchase"
    intro="What is asked here changes with the purpose you chose. A flat needs its costs itemised; a marriage advance asks none of this."
    note="The API today demands the property block and a repayment-bank block for every purpose, and asks the member for the trust’s own paying bank. All three need relaxing before this screen can be built as drawn."
    @back="router.push('/loans/apply/amount')"
    @continue="router.push('/loans/apply/documents')"
  >
    <div class="flex flex-col gap-5">
      <section class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="eyebrow">The property</h2>
          <p class="text-xs text-ink-faint">Asked only for housing advances</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField v-for="field in property" :key="field.key" :label="field.label" prefix="₹">
            <MoneyInput :model-value="field.value" />
          </FormField>
          <FormField label="Possession expected by">
            <input value="31 Mar 2027" class="tabular w-full bg-transparent outline-none" />
          </FormField>
        </div>

        <div
          class="flex items-baseline justify-between gap-4 border-t border-border pt-4 text-[15px]"
        >
          <span class="font-medium">Total cost</span>
          <span class="tabular text-lg font-semibold">₹{{ money(draft.totalCost) }}</span>
        </div>
      </section>

      <section class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="eyebrow">Where the money should go</h2>
          <p class="text-xs text-ink-faint">Your own account, taken from your profile</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            v-for="field in bank"
            :key="field.label"
            :label="field.label"
            readonly
            :mono="field.mono"
          >
            {{ field.value }}
          </FormField>
          <FormField label="Mobile" hint="Applies to this application only.">
            <input value="98220 41123" class="tabular w-full bg-transparent outline-none" />
          </FormField>
          <FormField label="Email" hint="Applies to this application only.">
            <input value="sunita.d@example.com" class="w-full bg-transparent outline-none" />
          </FormField>
        </div>

        <p class="text-[12.5px] leading-[1.55] text-ink-faint">
          Bank details come from your profile and cannot be changed here — a wrong account on an advance
          is very hard to undo.
          <RouterLink to="/profile/corrections" class="font-medium text-brand-700"
            >Request a correction</RouterLink
          >
          first if these are out of date. Phone and email apply to this application only.
        </p>
      </section>

      <!-- Drawn on the artboard as an explanation of the conditionality, and worth keeping: it answers
           "why am I being asked this?" without the member having to ask. -->
      <section class="flex flex-col gap-3">
        <h2 class="eyebrow">The same step, for other purposes</h2>
        <div class="grid gap-3 lg:grid-cols-3">
          <div
            v-for="item in otherPurposes"
            :key="item.title"
            class="rounded-xl border border-border-subtle bg-surface-sub px-4 py-3.5"
          >
            <p class="text-[13px] font-semibold">{{ item.title }}</p>
            <p class="mt-1 text-xs leading-[1.5] text-ink-muted">{{ item.body }}</p>
          </div>
        </div>
      </section>
    </div>
  </LoanFlowLayout>
</template>
