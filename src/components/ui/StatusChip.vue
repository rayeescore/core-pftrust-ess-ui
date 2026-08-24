<script setup>
import { computed } from 'vue'

/**
 * One chip, every application type — loan, transfer-in, settlement, correction request and query — so
 * the same meaning gets the same treatment wherever a member meets it.
 *
 * A pill with a leading dot, per the canvas. The dot is what lets the chip stay legible when the tint
 * behind it is as pale as these are, and it is the only part that carries the solid hue.
 *
 * The label arrives from the API already translated: the raw ApplicationStatus enum is mapped to
 * member-facing words server-side, so PENDING_FINAL_APPROVAL never reaches a browser and every client
 * says the same thing. This component maps the TONE, never the wording.
 *
 * Only `awaiting-final` is a filled chip. It is the one state where something is about to happen, and
 * the canvas gives it the emphasis for exactly that reason.
 */
const props = defineProps({
  label: { type: String, required: true },
  tone: { type: String, default: 'neutral' },
})

const tones = {
  neutral: { chip: 'bg-surface-deep text-ink-soft border-border', dot: 'bg-ink-faint' },
  info: { chip: 'bg-info-50 text-info-700 border-info-200', dot: 'bg-info-500' },
  'awaiting-final': { chip: 'bg-info-500 text-white border-info-500', dot: 'bg-white' },
  progress: { chip: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'bg-warning-500' },
  success: { chip: 'bg-success-50 text-success-700 border-success-200', dot: 'bg-success-500' },
  warning: { chip: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'bg-warning-500' },
  // Deliberately not the brand red. If those converge a member cannot tell a header from a refusal.
  danger: { chip: 'bg-danger-50 text-danger-700 border-danger-200', dot: 'bg-danger-500' },
  muted: { chip: 'bg-surface-deep text-ink-faint border-border', dot: 'bg-ink-faintest' },
}

const tone = computed(() => tones[props.tone] ?? tones.neutral)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-[7px] rounded-full border py-[5px] pr-3 pl-[9px] text-[12.5px] font-medium whitespace-nowrap"
    :class="tone.chip"
  >
    <span class="size-1.5 shrink-0 rounded-full" :class="tone.dot" />
    {{ label }}
  </span>
</template>
