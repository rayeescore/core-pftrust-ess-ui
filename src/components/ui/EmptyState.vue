<script setup>
/**
 * Every list needs one, and it says what to do next rather than "No data".
 *
 * A new joiner meets three of these at once -- no contributions, no statements, no queries -- and it
 * must not feel like the portal is broken. Hence the explanation of *why* it is empty and *when* it
 * will not be.
 */
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <div class="rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center">
    <p class="text-sm font-semibold text-ink">{{ title }}</p>
    <p v-if="$slots.default" class="mx-auto mt-2 max-w-md text-sm text-ink-muted"><slot /></p>
    <div v-if="$slots.action" class="mt-4"><slot name="action" /></div>
  </div>
</template>
