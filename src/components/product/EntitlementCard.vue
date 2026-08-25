<script setup>
import { money } from '@/composables/useFormat'

/**
 * "You can withdraw up to ₹X", and the four limits that produced it.
 *
 * The derivation is not decoration. Four separate rules apply to an advance — a multiple of PF base
 * salary, the balance actually in the account, the cost the member declared, and what they asked for —
 * and the entitlement is the LOWEST of them. A member shown only the final figure has no way to tell
 * whether asking for more would help, and the answer depends entirely on which limb bound.
 *
 * Which limbs apply changes with the purpose: a marriage advance is not capped by PF base salary at
 * all, so the list is data from the API rather than a fixed four rows here.
 */
defineProps({
  entitlement: { type: Object, required: true },
})
</script>

<template>
  <div class="overflow-hidden rounded-card border border-brand-100 bg-brand-50">
    <div class="flex flex-col gap-1.5 px-5 pt-5 pb-4">
      <p class="text-[13px] font-medium" style="color: var(--color-brand-700)">
        You can withdraw up to
      </p>
      <p class="flex items-baseline gap-[3px]">
        <span class="text-xl" style="color: var(--color-brand-600)">₹</span>
        <span class="tabular font-display text-[38px] leading-[1.1]" style="color: oklch(0.375 0.14 25)">
          {{ money(entitlement.amount) }}
        </span>
      </p>
    </div>

    <div class="flex flex-col gap-[11px] border-t border-brand-100 bg-surface px-5 py-4">
      <p class="eyebrow">How this was worked out</p>

      <dl class="flex flex-col gap-2">
        <div
          v-for="limb in entitlement.limbs"
          :key="limb.label"
          class="flex items-baseline justify-between gap-4 text-[13px]"
          :class="limb.binding ? 'font-semibold' : 'text-ink-muted'"
        >
          <dt>{{ limb.label }}</dt>
          <dd class="tabular">₹{{ money(limb.amount) }}</dd>
        </div>
      </dl>

      <p class="text-xs leading-[1.5] text-ink-faint">{{ entitlement.explanation }}</p>
    </div>

    <div v-if="entitlement.balanceAfter !== undefined" class="border-t border-brand-100 bg-surface px-5 py-4">
      <p class="eyebrow eyebrow-faint">Your balance afterwards</p>
      <p class="tabular mt-1 text-lg font-semibold">₹{{ money(entitlement.balanceAfter) }}</p>
      <p class="mt-1 text-xs leading-[1.5] text-ink-faint">{{ entitlement.balanceAfterNote }}</p>
    </div>
  </div>
</template>
