<script setup>
import { ref } from 'vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * One of the three buckets every balance in this system splits into: the member's own contribution, the
 * company's, and voluntary (VPF).
 *
 * Bordered rather than raised, and it sits INSIDE the balance card — these are one figure broken down,
 * not three separate facts, and the canvas nests them to say so.
 *
 * The tax split stays behind the footer strip on purpose. The system's model is 3 buckets x 2 tax
 * classes x (contribution + interest) = twelve figures; the member's model is one number. Putting all
 * twelve on the dashboard would be showing them the database rather than their money.
 */
defineProps({
  title: { type: String, required: true },
  total: { type: [String, Number, null], default: null },
  contributed: { type: [String, Number, null], default: null },
  interest: { type: [String, Number, null], default: null },
  taxable: { type: [String, Number, null], default: null },
  nonTaxable: { type: [String, Number, null], default: null },
})

const open = ref(false)
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-border">
    <div class="flex flex-col gap-[11px] px-[17px] py-[15px]">
      <h3 class="text-[13.5px] font-semibold">{{ title }}</h3>

      <MoneyDisplay :amount="total" size="md" />

      <dl class="flex gap-[18px]">
        <div class="flex flex-col gap-px">
          <dt class="text-[11px] text-ink-faint">Contributed</dt>
          <dd><MoneyDisplay :amount="contributed" size="xs" /></dd>
        </div>
        <div class="flex flex-col gap-px">
          <dt class="text-[11px] text-ink-faint">Interest</dt>
          <dd><MoneyDisplay :amount="interest" size="xs" /></dd>
        </div>
      </dl>
    </div>

    <button
      class="flex w-full items-center justify-between border-t border-border bg-surface-sub px-[17px] py-[9px] text-left text-ink-muted transition-colors hover:bg-surface-deep"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="text-xs">Tax split</span>
      <AppIcon
        name="chevronDown"
        :size="14"
        class="transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <dl v-if="open" class="flex gap-[18px] border-t border-border bg-surface-sub px-[17px] py-3">
      <div class="flex flex-col gap-px">
        <dt class="text-[11px] text-ink-faint">Non-taxable</dt>
        <dd><MoneyDisplay :amount="nonTaxable" size="xs" /></dd>
      </div>
      <div class="flex flex-col gap-px">
        <dt class="text-[11px] text-ink-faint">Taxable</dt>
        <dd><MoneyDisplay :amount="taxable" size="xs" /></dd>
      </div>
    </dl>
  </div>
</template>
