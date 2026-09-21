<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import * as me from '@/api/me'
import { useLoanDraft } from '@/composables/useLoanDraft'
import { money } from '@/composables/useFormat'
import LoanFlowLayout from '@/layouts/LoanFlowLayout.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import {
  COMPLETION_DATE,
  PROPERTY_COSTS,
  PROPERTY_COST_FIELDS,
  REPAYMENT_BANK,
  REPAYMENT_BANK_FIELDS,
  asks,
  propertyFor,
  repaymentBankFor,
} from '@/composables/useLoanFields'

/**
 * Step 3: the details, and which of them are asked depends entirely on the purpose.
 *
 * A purchase itemises the property; a marriage advance asks none of it. That conditionality is
 * the whole design of this step, and until the API was relaxed it could not be built as drawn — every
 * purpose had to send a property block and a repayment-bank block, and had to name the trust's own
 * paying bank. All three are gone now: `Loan.build` tolerates an absent block, and the paying bank is
 * chosen by the PF department when the money actually moves.
 *
 * **The purpose says what it asks, and this screen only reads it.** Each purpose carries an `asks`
 * array from `GET /me/loans/types`; see `useLoanFields` for why this is not the group name it used to
 * be, and what a pension withdrawal in group A did to the old reading. Three purposes are visibly
 * different for it: 02 asks when the house was finished and for none of the costs, 13 asks for the
 * lender and for no property, and 06 asks neither although it sits with the housing codes.
 *
 * **Bank details are read-only, and that is a security property rather than a convenience.** They come
 * from the employee master, which is SAP-owned with no update endpoint of any kind. The API copies them
 * server-side and ignores anything sent in their place, because a member who could type an account
 * number on an advance could redirect their own disbursement.
 */
const router = useRouter()
const draft = useLoanDraft()

const profile = ref(null)

const needsPropertyCosts = computed(() => asks(draft.value.purpose, PROPERTY_COSTS))

/** Code 02 alone: an alteration is asked when the house was finished, and for none of the costs. */
const needsCompletionDate = computed(() => asks(draft.value.purpose, COMPLETION_DATE))

/** Code 13 alone: Repayment of Housing Loan is the one purpose where the money goes to a lender. */
const needsRepaymentBank = computed(() => asks(draft.value.purpose, REPAYMENT_BANK))

const needsProperty = computed(() => needsPropertyCosts.value || needsCompletionDate.value)

/** Keep only what this purpose asks for, carrying over anything the member already typed. */
function fitBlocksToPurpose() {
  draft.value.property = propertyFor(draft.value.purpose, draft.value.property)
  draft.value.repaymentBank = repaymentBankFor(draft.value.purpose, draft.value.repaymentBank)
}

onMounted(async () => {
  fitBlocksToPurpose()

  profile.value = await me.getProfile()

  // Pre-filled from the profile, editable for this application only -- so a member reachable on a
  // different number this month does not have to raise a correction before they can apply.
  draft.value.contactNumber ||= profile.value?.mobile ?? ''
  draft.value.emailId ||= profile.value?.email ?? ''
})

// A member who goes back and changes the purpose must not carry the previous purpose's answers
// forward: a stamp duty left over from a purchase would otherwise be sent on a marriage advance, where
// the API would store it against a purpose that has no property at all -- and, less obviously, on an
// alteration, which is "housing" too and is asked for no costs whatever.
watch(() => draft.value.purpose?.code, fitBlocksToPurpose)

/** A house cannot have been finished in the future, and the browser can say so before the API does. */
const today = new Date().toISOString().slice(0, 10)

// Shared with the reset above, so the form cannot render a field the reset does not carry.
const propertyFields = PROPERTY_COST_FIELDS
const repaymentFields = REPAYMENT_BANK_FIELDS

/** Shown to the member. The API sums it again and uses its own figure, never this one. */
const propertyTotal = computed(() =>
  propertyFields.reduce((total, field) => total + Number(draft.value.property?.[field.key] || 0), 0),
)

const bankRows = computed(() => {
  const bank = profile.value?.bank
  if (!bank) return []
  return [
    { label: 'Bank', value: bank.name },
    { label: 'Branch', value: bank.branch },
    { label: 'Account number', value: bank.account, mono: true },
    { label: 'IFSC / MICR', value: bank.codes, mono: true },
  ].filter((row) => row.value)
})

const canContinue = computed(() => Boolean(draft.value.contactNumber && draft.value.emailId))

/**
 * The step's own sentence, which has to be true of the purpose in front of the member. It used to say
 * a flat needed its costs itemised whatever they had chosen, on a screen that then asked them for
 * nothing of the sort.
 */
const intro = computed(() => {
  if (needsPropertyCosts.value) {
    return 'What is asked here changes with the purpose you chose. This one needs the property’s costs itemised.'
  }
  if (needsCompletionDate.value) {
    return 'What is asked here changes with the purpose you chose. This one needs the date the house was finished.'
  }
  if (needsRepaymentBank.value) {
    return 'What is asked here changes with the purpose you chose. This one needs the lender you are repaying, because the money goes to them.'
  }
  return 'This purpose needs nothing beyond where the money should go. Check the details below and carry on.'
})
</script>

<template>
  <LoanFlowLayout
    :step="3"
    :title="needsProperty ? 'Tell us about the property' : 'Where the money should go'"
    :intro="intro"
    note="The trust’s own paying bank and payment mode are chosen by the PF department later, never by you."
    :can-continue="canContinue"
    @back="router.push('/loans/apply/amount')"
    @continue="router.push('/loans/apply/documents')"
  >
    <div class="flex flex-col gap-5">
      <section
        v-if="needsProperty && draft.property"
        class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="eyebrow">The property</h2>
          <p class="text-xs text-ink-faint">Asked for {{ draft.purpose?.title }}</p>
        </div>

        <!--
          Code 02 alone, and it is asked *instead of* the costs rather than alongside them. That is the
          staff form's own rule: an alteration to a house the trust has already financed is allowed on
          the strength of when that house was finished, and the trust has never recorded what the
          alteration costs. Asking for both would be asking a question nobody reads.
        -->
        <div v-if="needsCompletionDate" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="When was the house finished?"
            hint="The date of completion, as it appears on your occupancy or completion certificate."
          >
            <input
              v-model="draft.property.dateOfCompletionOfHouse"
              type="date"
              :max="today"
              class="tabular w-full bg-transparent outline-none"
            />
          </FormField>
        </div>

        <template v-if="needsPropertyCosts">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField v-for="field in propertyFields" :key="field.key" :label="field.label" prefix="₹">
              <MoneyInput v-model="draft.property[field.key]" />
            </FormField>
          </div>

          <div
            class="flex items-baseline justify-between gap-4 border-t border-border pt-4 text-[15px]"
          >
            <span class="font-medium">Total cost</span>
            <span class="tabular text-lg font-semibold">₹{{ money(propertyTotal) }}</span>
          </div>
        </template>
      </section>

      <section
        v-if="needsRepaymentBank && draft.repaymentBank"
        class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="eyebrow">The loan you are repaying</h2>
          <p class="text-xs text-ink-faint">The money goes to them, not to you</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            v-for="field in repaymentFields"
            :key="field.key"
            :label="field.label"
            :mono="field.mono"
          >
            <input
              v-model="draft.repaymentBank[field.key]"
              class="w-full bg-transparent outline-none"
              :class="field.mono ? 'font-mono' : ''"
            />
          </FormField>
        </div>
      </section>

      <section class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="eyebrow">Where the money should go</h2>
          <p class="text-xs text-ink-faint">Your own account, taken from your profile</p>
        </div>

        <div v-if="!profile" class="h-20 animate-pulse rounded-xl bg-surface-deep" />

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            v-for="row in bankRows"
            :key="row.label"
            :label="row.label"
            readonly
            :mono="row.mono"
          >
            {{ row.value }}
          </FormField>

          <FormField label="Mobile" hint="Applies to this application only.">
            <input v-model="draft.contactNumber" class="tabular w-full bg-transparent outline-none" />
          </FormField>
          <FormField label="Email" hint="Applies to this application only.">
            <input v-model="draft.emailId" class="w-full bg-transparent outline-none" />
          </FormField>
        </div>

        <p v-if="profile && !bankRows.length" class="text-[13px] leading-relaxed text-ink-muted">
          We have no bank account on record for you. You can still apply — the PF department will ask
          for your account before anything is paid — but
          <RouterLink to="/profile/corrections" class="font-medium text-brand-700"
            >adding it now</RouterLink
          >
          will save a week.
        </p>

        <p class="text-[12.5px] leading-[1.55] text-ink-faint">
          Bank details come from your profile and cannot be changed here — a wrong account on an advance
          is very hard to undo.
          <RouterLink to="/profile/corrections" class="font-medium text-brand-700"
            >Request a correction</RouterLink
          >
          first if these are out of date. Phone and email apply to this application only.
        </p>
      </section>
    </div>
  </LoanFlowLayout>
</template>
