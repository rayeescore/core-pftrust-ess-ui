<script setup>
import { computed } from 'vue'

/**
 * A rupee amount the member types, shown grouped the Indian way as they type it.
 *
 * Grouping while typing rather than only on blur, because these are large numbers — the difference
 * between ₹3,00,000 and ₹30,00,000 is one keystroke and is invisible in an ungrouped string. A member
 * asking for ten times what they meant is the mistake this component exists to prevent.
 *
 * The model stays a plain digit string; only the display is grouped. Nothing downstream should have to
 * strip commas out of a number it was given.
 */
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
})

const emit = defineEmits(['update:modelValue'])

const GROUPER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

const display = computed(() => {
  const digits = String(props.modelValue ?? '').replace(/\D/g, '')
  return digits === '' ? '' : GROUPER.format(Number(digits))
})

function onInput(event) {
  const digits = event.target.value.replace(/\D/g, '')
  // Re-render from the model so a stray comma the user typed never survives into it.
  event.target.value = digits === '' ? '' : GROUPER.format(Number(digits))
  emit('update:modelValue', digits)
}
</script>

<template>
  <input
    :value="display"
    inputmode="numeric"
    class="tabular w-full bg-transparent outline-none"
    @input="onInput"
  />
</template>
