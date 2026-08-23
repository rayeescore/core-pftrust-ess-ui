<script setup>
import { ref } from 'vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'

/**
 * One of the three buckets every balance in this system splits into: the member's own contribution, the
 * company's, and voluntary (VPF).
 *
 * The tax split stays collapsed on purpose. The system's model is 3 buckets x 2 tax classes x
 * (contribution + interest) = twelve figures; the member's model is one number. Putting all twelve on
 * the dashboard would be showing them the database rather than their money.
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  total: { type: [String, Number, null], default: null },
  contributed: { type: [String, Number, null], default: null },
  interest: { type: [String, Number, null], default: null },
  taxable: { type: [String, Number, null], default: null },
  nonTaxable: { type: [String, Number, null], default: null },
})

const open = ref(false)
</script>

<template>
  <div class="rounded-card bg-surface p-5 ring-1 ring-border">
    <div class="flex items-baseline justify-between gap-2">
      <div>
        <h3 class="text-sm font-semibold text-ink">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs text-ink-faint">{{ subtitle }}</p>
      </div>
    </div>

    <div class="mt-3">
      <MoneyDisplay :amount="total" size="lg" />
    </div>

    <dl class="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
      <div>
        <dt class="text-xs text-ink-faint">Contributed</dt>
        <dd class="mt-0.5"><MoneyDisplay :amount="contributed" size="sm" /></dd>
      </div>
      <div>
        <dt class="text-xs text-ink-faint">Interest</dt>
        <dd class="mt-0.5"><MoneyDisplay :amount="interest" size="sm" /></dd>
      </div>
    </dl>

    <button
      class="mt-3 -mb-1 text-xs font-medium text-brand-600 hover:text-brand-700"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ open ? 'Hide' : 'Show' }} taxable / non-taxable split
    </button>

    <dl v-if="open" class="mt-3 grid grid-cols-2 gap-3 rounded-md bg-surface-sub p-3 text-sm">
      <div>
        <dt class="text-xs text-ink-faint">Non-taxable</dt>
        <dd class="mt-0.5"><MoneyDisplay :amount="nonTaxable" size="sm" /></dd>
      </div>
      <div>
        <dt class="text-xs text-ink-faint">Taxable</dt>
        <dd class="mt-0.5"><MoneyDisplay :amount="taxable" size="sm" /></dd>
      </div>
    </dl>
  </div>
</template>
