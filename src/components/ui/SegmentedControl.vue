<script setup>
/**
 * The sliding-thumb control the passbook uses for its taxable filter.
 *
 * A segmented control rather than three columns doubled: the taxable and non-taxable halves of every
 * figure would make an eight-column table sixteen, and nobody reads a member's own passbook that way.
 * Filtering says the same thing and keeps the table legible.
 */
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex rounded-[10px] border border-border bg-surface-deep p-[3px]" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      role="tab"
      :aria-selected="modelValue === option.value"
      class="rounded-[7px] px-3.5 py-2 text-[13px] transition-colors"
      :class="
        modelValue === option.value
          ? 'bg-surface font-semibold shadow-sm'
          : 'text-ink-muted hover:text-ink'
      "
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
