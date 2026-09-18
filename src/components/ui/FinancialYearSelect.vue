<script setup>
import { financialYear } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * Picking a financial year.
 *
 * Deliberately NOT a date picker. A financial year runs April to March and is named by the calendar
 * year it ENDS in, so a normal date control would offer the wrong unit and invite the wrong label. The
 * options are the years the API says a statement exists for, so a member is never offered a year that
 * would come back empty.
 */
defineProps({
  modelValue: { type: Number, required: true },
  years: { type: Array, required: true },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative">
    <select
      class="min-h-11 w-full min-w-[9.5rem] appearance-none rounded-[10px] border border-border-strong bg-surface py-2.5 pr-10 pl-4 text-base font-medium sm:min-w-[176px]"
      :value="modelValue"
      @change="$emit('update:modelValue', Number($event.target.value))"
    >
      <option v-for="year in years" :key="year" :value="year">{{ financialYear(year) }}</option>
    </select>
    <AppIcon
      name="chevronDown"
      :size="15"
      class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-muted"
    />
  </div>
</template>
