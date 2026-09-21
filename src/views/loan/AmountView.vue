<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as me from '@/api/me'
import { useLoanDraft } from '@/composables/useLoanDraft'
import { costQuestion } from '@/composables/useLoanFields'
import LoanFlowLayout from '@/layouts/LoanFlowLayout.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import EntitlementCard from '@/components/product/EntitlementCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * Step 2: how much.
 *
 * The entitlement recalculates as the member types, and the warning beside it is the one thing on this
 * screen that is not arithmetic: **an advance is not repaid.** It comes permanently out of the fund, so
 * the balance and the interest it would have earned both drop. A member who reads "advance" as "loan"
 * is making a different decision from the one they think they are making.
 */
const router = useRouter()
const draft = useLoanDraft()
const entitlement = ref(null)

/** What "the total cost" means for this purpose, in words that fit it. */
const cost = computed(() => costQuestion(draft.value.purpose))

async function recalculate() {
  entitlement.value = await me.checkLoanEligibility({
    code: draft.value.purpose?.code,
    totalCost: draft.value.totalCost,
    requested: draft.value.requested,
  })
  // Carried forward so the review step can show the figure the member is actually agreeing to without
  // asking again. The API recomputes it on submit regardless; this is what they saw, not what they get.
  draft.value.entitlement = entitlement.value?.amount ?? null
}

onMounted(recalculate)
watch(() => [draft.value.totalCost, draft.value.requested], recalculate)

// The API brings a request above the entitlement down to it rather than refusing: the member asked for
// a number that is not available, and the useful answer is the one that is.
const cappedNote = computed(() =>
  entitlement.value && Number(draft.value.requested) > Number(entitlement.value.amount)
    ? 'You asked for more than your account holds, so the figure beside has been brought down to your balance. You may lower it, not raise it.'
    : 'You may ask for less than your entitlement. Most members do.',
)
</script>

<template>
  <LoanFlowLayout
    :step="2"
    title="How much do you need?"
    intro="Your entitlement updates as you type. Four separate limits apply and the lowest of them is what you can take."
    note="The figures on the right come straight from the trust’s rules for this purpose. Nothing here is a promise until both approvers have signed."
    @back="router.push('/loans/apply')"
    @continue="router.push('/loans/apply/details')"
  >
    <div class="grid items-start gap-5 *:min-w-0 lg:grid-cols-[1.15fr_1fr]">
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]">
          <!--
            Worded for the purpose. This asked "What will the flat cost in total?" of every purpose --
            of a marriage, of a hospital admission, of a pre-retirement withdrawal -- as the first
            question on the screen. See useLoanFields.costQuestion.
          -->
          <FormField :label="cost.label" prefix="₹" :hint="cost.hint">
            <MoneyInput v-model="draft.totalCost" />
          </FormField>

          <FormField label="How much do you want from your PF?" prefix="₹" :hint="cappedNote">
            <MoneyInput v-model="draft.requested" />
          </FormField>
        </div>

        <!--
          The most important sentence on the screen, and the reason it gets its own panel rather than
          becoming a hint under a field.
        -->
        <aside class="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3.5">
          <AppIcon name="warning" :size="18" class="mt-px text-warning-500" />
          <p class="text-[13px] leading-[1.55] text-warning-700">
            <span class="font-semibold">This advance is not repaid.</span> It is taken permanently out
            of your fund, so your balance and the interest it earns both drop. Take what you need, not
            what you can.
          </p>
        </aside>
      </div>

      <EntitlementCard v-if="entitlement" :entitlement="entitlement" />
      <div v-else class="h-80 animate-pulse rounded-card bg-surface-deep" />
    </div>
  </LoanFlowLayout>
</template>
