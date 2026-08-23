<script setup>
/**
 * A standing message about the account, not a transient one.
 *
 * Errors never go in a toast -- they belong beside the thing that failed. Banners carry the states that
 * change what the whole portal offers: a nominee share that does not total 100, an in-operable account,
 * year end in progress, a member who has left and is waiting on settlement.
 */
defineProps({
  tone: { type: String, default: 'info' },
  title: { type: String, required: true },
})

const tones = {
  info: 'bg-info-50 ring-info-500/20',
  warning: 'bg-warning-50 ring-warning-500/25',
  success: 'bg-success-50 ring-success-500/20',
  danger: 'bg-danger-50 ring-danger-500/20',
}
</script>

<template>
  <div class="rounded-card px-4 py-3 ring-1 ring-inset" :class="tones[tone]">
    <p class="text-sm font-semibold text-ink">{{ title }}</p>
    <p v-if="$slots.default" class="mt-1 text-sm text-ink-muted"><slot /></p>
    <div v-if="$slots.action" class="mt-2"><slot name="action" /></div>
  </div>
</template>
