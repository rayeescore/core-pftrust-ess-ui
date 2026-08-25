<script setup>
import LoanStepRail from '@/components/product/LoanStepRail.vue'

/**
 * The frame the five advance steps share: the step rail above, the heading, and the footer that carries
 * the note and the Back/Continue pair.
 *
 * Kept as a layout rather than repeated in each step because the footer note changes per step but its
 * shape does not — and a Continue button that moved by a few pixels between steps would be the sort of
 * thing nobody notices in review and everybody feels in use.
 */
defineProps({
  step: { type: Number, required: true },
  title: { type: String, required: true },
  intro: { type: String, default: '' },
  note: { type: String, default: '' },
  continueLabel: { type: String, default: 'Continue' },
  canContinue: { type: Boolean, default: true },
})

defineEmits(['back', 'continue'])
</script>

<template>
  <div>
    <LoanStepRail :current="step" />

    <header class="mb-[22px] flex flex-col gap-1.5">
      <h1 class="font-display text-[30px] leading-[1.15]">{{ title }}</h1>
      <p v-if="intro" class="max-w-[66ch] text-sm leading-relaxed text-ink-muted">{{ intro }}</p>
    </header>

    <slot />

    <footer
      class="mt-[26px] flex flex-wrap items-center justify-between gap-5 border-t border-border pt-5"
    >
      <p class="max-w-[62ch] flex-1 text-[12.5px] leading-[1.55] text-ink-faint">{{ note }}</p>
      <div class="flex shrink-0 items-center gap-3">
        <button
          v-if="step > 1"
          class="min-h-11 rounded-[10px] border border-border-strong px-6 text-[15px] font-medium transition-colors hover:bg-surface-sub"
          @click="$emit('back')"
        >
          Back
        </button>
        <button
          class="min-h-11 rounded-[10px] bg-brand-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canContinue"
          @click="$emit('continue')"
        >
          {{ continueLabel }}
        </button>
      </div>
    </footer>
  </div>
</template>
