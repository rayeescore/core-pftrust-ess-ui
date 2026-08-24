<script setup>
/**
 * The compact four-segment progress bar the dashboard uses for an application in flight.
 *
 * Deliberately NOT the full stepper. The dashboard summarises several applications at a glance and the
 * detail screen explains one — the canvas draws a bar here and a dated stepper there, and using the
 * stepper in both places makes the dashboard a wall of milestones nobody reads.
 *
 * Four segments because two different people must approve. The API enforces maker-checker in
 * ApprovalAccess, so "Under review" and "Final approval" are two genuinely different waits with two
 * different people in them; collapsing them makes the second look like the first having stalled, which
 * is the thing members raise queries about.
 */
defineProps({
  /** How many of the four milestones are behind the member. */
  completed: { type: Number, default: 0 },
  /** Whether the step in flight is the one about to complete, which the canvas colours differently. */
  current: { type: Boolean, default: true },
  rejected: { type: Boolean, default: false },
})
</script>

<template>
  <div class="flex items-center gap-[5px]" role="img" :aria-label="`Step ${completed + 1} of 4`">
    <span
      v-for="step in 4"
      :key="step"
      class="h-1 flex-1 rounded-full"
      :class="[
        rejected && step > completed
          ? 'bg-danger-500'
          : step <= completed
            ? 'bg-success-500'
            : step === completed + 1 && current
              ? 'bg-info-500'
              : 'bg-track',
      ]"
    />
  </div>
</template>
