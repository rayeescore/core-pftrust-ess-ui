<script setup>
import { computed } from 'vue'
import { money, hasAmount } from '@/composables/useFormat'

/**
 * Money is the hero content of this portal, and this is the only component that renders it.
 *
 * Three things it does that a bare number cannot: Indian digit grouping, tabular figures so columns
 * align, and the rupee sign set smaller and muted so the digits carry. The `—` state for an amount that
 * has not been computed yet is deliberate and is why every caller passes a possibly-null value straight
 * through rather than defaulting it to zero first.
 */
const props = defineProps({
  amount: { type: [String, Number, null], default: null },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['display', 'lg', 'md', 'sm'].includes(v),
  },
  decimals: { type: Boolean, default: false },
})

const formatted = computed(() => money(props.amount, { decimals: props.decimals }))
const present = computed(() => hasAmount(props.amount))

const sizes = {
  display: 'text-5xl sm:text-6xl font-semibold tracking-tight',
  lg: 'text-3xl font-semibold',
  md: 'text-xl font-semibold',
  sm: 'text-base font-medium',
}

const symbolSizes = {
  display: 'text-2xl sm:text-3xl',
  lg: 'text-lg',
  md: 'text-sm',
  sm: 'text-xs',
}
</script>

<template>
  <span class="tabular inline-flex items-baseline gap-1" :class="sizes[size]">
    <span v-if="present" class="text-ink-faint font-normal" :class="symbolSizes[size]">₹</span>
    <span :class="present ? '' : 'text-ink-faint'">{{ formatted }}</span>
  </span>
</template>
