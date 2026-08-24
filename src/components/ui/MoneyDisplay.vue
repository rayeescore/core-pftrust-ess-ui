<script setup>
import { computed } from 'vue'
import { money, hasAmount } from '@/composables/useFormat'

/**
 * Money is the hero content of this portal, and this is the only component that renders it.
 *
 * The `display` size sets the figure in the SERIF, which is the decision that stops this reading as an
 * admin console: a balance in the same sans as the navigation is a data cell; a balance in Tiro is a
 * statement. The rupee sign is always smaller and muted so the digits carry.
 *
 * The `—` state for an amount that has not been computed yet is why every caller passes a possibly-null
 * value straight through rather than defaulting it to zero first. A zero is a fact; a dash is a wait.
 */
const props = defineProps({
  amount: { type: [String, Number, null], default: null },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['display', 'lg', 'md', 'sm', 'xs'].includes(v),
  },
  decimals: { type: Boolean, default: false },
})

const formatted = computed(() => money(props.amount, { decimals: props.decimals }))
const present = computed(() => hasAmount(props.amount))

const figure = {
  display: 'font-display text-[52px] leading-none',
  lg: 'text-2xl font-semibold',
  md: 'text-[23px] font-semibold',
  sm: 'text-[17px] font-semibold',
  xs: 'text-[13px] font-medium',
}

const symbol = {
  display: 'font-display text-[30px]',
  lg: 'text-sm',
  md: 'text-sm',
  sm: 'text-xs',
  xs: 'text-[13px]',
}
</script>

<template>
  <span class="tabular inline-flex items-baseline" :class="size === 'display' ? 'gap-1' : 'gap-[3px]'">
    <span v-if="present" class="font-normal text-ink-muted" :class="symbol[size]">₹</span>
    <span :class="[figure[size], present ? '' : 'text-ink-faint']">{{ formatted }}</span>
  </span>
</template>
