<script setup>
import { computed } from 'vue'

/**
 * One chip, every application type.
 *
 * Shared by loan, transfer-in, settlement, correction request and query, so the same meaning gets the
 * same colour wherever a member meets it.
 *
 * The label comes from the API already translated -- the raw ApplicationStatus enum is mapped to
 * member-facing words server-side, so PENDING_FINAL_APPROVAL never reaches a browser and every client
 * says the same thing. This component maps the *tone*, and falls back to neutral for a tone it does not
 * recognise rather than rendering an unstyled chip.
 *
 * Only "awaiting-final" is a filled chip: it is the one state where something is about to happen.
 */
const props = defineProps({
  label: { type: String, required: true },
  tone: { type: String, default: 'neutral' },
})

const tones = {
  neutral: 'bg-surface-deep text-ink-muted ring-border',
  info: 'bg-info-50 text-info-700 ring-info-500/20',
  'awaiting-final': 'bg-info-500 text-white ring-info-500',
  progress: 'bg-progress-50 text-progress-700 ring-progress-500/25',
  success: 'bg-success-50 text-success-700 ring-success-500/20',
  warning: 'bg-warning-50 text-warning-700 ring-warning-500/25',
  // Deliberately not the brand red. Brand red means identity and primary action; if it also meant
  // "rejected" a member could not tell a header from a refusal.
  danger: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  muted: 'bg-surface-deep text-ink-faint ring-border',
}

const classes = computed(() => tones[props.tone] ?? tones.neutral)
</script>

<template>
  <span
    class="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap"
    :class="classes"
  >
    {{ label }}
  </span>
</template>
