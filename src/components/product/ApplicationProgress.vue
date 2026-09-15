<script setup>
/**
 * The compact segmented progress bar the dashboard uses for an application in flight.
 *
 * Deliberately NOT the full stepper. The dashboard summarises several applications at a glance and the
 * detail screen explains one — the canvas draws a bar here and a dated stepper there, and using the
 * stepper in both places makes the dashboard a wall of milestones nobody reads.
 *
 * Four segments for an advance, because two different people must approve. The API enforces
 * maker-checker in ApprovalAccess, so "Under review" and "Final approval" are two genuinely different
 * waits with two different people in them; collapsing them makes the second look like the first having
 * stalled, which is the thing members raise queries about.
 *
 * Three for a transfer-in — submitted, accepted, credited — which has one approval and no payment. The
 * API sends its completedSteps on that scale, so drawing it on four made a fresh request look a quarter
 * done and an accepted one half.
 */
defineProps({
  /** How many of the milestones are behind the member. */
  completed: { type: Number, default: 0 },
  /** How many milestones this kind of application has. */
  total: { type: Number, default: 4 },
  /** Whether the step in flight is the one about to complete, which the canvas colours differently. */
  current: { type: Boolean, default: true },
  rejected: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="flex items-center gap-[5px]"
    role="img"
    :aria-label="`Step ${Math.min(completed + 1, total)} of ${total}`"
  >
    <span
      v-for="step in total"
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
