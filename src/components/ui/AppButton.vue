<script setup>
import { computed } from 'vue'

/**
 * Tailwind ships no components, so this is designed rather than selected.
 *
 * Minimum 44px hit target on every size but `sm`, and `sm` is desktop-only -- never a primary action on
 * a phone, which is where most members are.
 */
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v),
  },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:outline-brand-600',
  secondary:
    'bg-surface text-ink ring-1 ring-inset ring-border-strong hover:bg-surface-deep focus-visible:outline-brand-600',
  ghost: 'text-ink-muted hover:bg-surface-deep hover:text-ink focus-visible:outline-brand-600',
  danger: 'bg-danger-500 text-white hover:bg-danger-700 focus-visible:outline-danger-700',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const inert = computed(() => props.disabled || props.loading)
</script>

<template>
  <button
    :disabled="inert"
    :aria-busy="loading"
    class="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variants[variant], sizes[size]]"
  >
    <svg v-if="loading" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <slot />
  </button>
</template>
