<script setup>
import { computed } from 'vue'
import { displayDate } from '@/composables/useFormat'

/**
 * The four milestones of an advance, a settlement or a transfer-in.
 *
 * There are four rather than three because **two different people must approve**. The API enforces
 * maker-checker in ApprovalAccess -- the same person cannot do both stages -- so "Under review" and
 * "Final approval" are two genuinely different waits with two different people in them. Collapsing them
 * would make the second one look like the first one having stalled, which is the thing members raise
 * queries about.
 *
 * A rejected application replaces the remaining steps rather than greying them, and always carries the
 * reason. Today only transfer-in stores one; until loan and settlement do too, the reason falls back to
 * pointing the member at the PF department rather than showing them a dead end.
 */
const props = defineProps({
  steps: { type: Array, required: true },
  rejected: { type: Object, default: null },
})

const lastDone = computed(() => {
  const index = props.steps.map((step) => Boolean(step.date)).lastIndexOf(true)
  return index
})
</script>

<template>
  <ol class="flex flex-col gap-0 sm:flex-row sm:gap-0">
    <li
      v-for="(step, index) in steps"
      :key="step.label"
      class="relative flex flex-1 gap-3 pb-6 sm:flex-col sm:pb-0"
    >
      <!-- Connector: vertical on mobile, horizontal on desktop. -->
      <div
        v-if="index < steps.length - 1"
        class="absolute top-6 left-[11px] h-full w-px sm:top-[11px] sm:left-6 sm:h-px sm:w-full"
        :class="index < lastDone ? 'bg-success-500' : 'bg-border'"
        aria-hidden="true"
      />

      <div class="relative z-10 shrink-0">
        <span
          class="flex size-6 items-center justify-center rounded-full ring-4 ring-surface"
          :class="
            index <= lastDone
              ? 'bg-success-500 text-white'
              : index === lastDone + 1
                ? 'bg-info-500 text-white'
                : 'bg-surface-deep text-ink-faint ring-1 ring-border'
          "
        >
          <svg v-if="index <= lastDone" viewBox="0 0 20 20" fill="currentColor" class="size-3.5">
            <path
              fill-rule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
              clip-rule="evenodd"
            />
          </svg>
          <span v-else class="text-[11px] font-semibold">{{ index + 1 }}</span>
        </span>
      </div>

      <div class="min-w-0 sm:mt-3 sm:pr-4">
        <p class="text-sm font-medium text-ink">{{ step.label }}</p>
        <p class="mt-0.5 text-xs text-ink-muted">
          <template v-if="step.date">{{ displayDate(step.date) }}</template>
          <template v-else-if="index === lastDone + 1 && step.since">
            Since {{ displayDate(step.since) }}
          </template>
          <template v-else>Not yet</template>
        </p>
      </div>
    </li>
  </ol>

  <div v-if="rejected" class="mt-4 rounded-card bg-danger-50 px-4 py-3 ring-1 ring-inset ring-danger-500/20">
    <p class="text-sm font-semibold text-danger-700">
      Rejected on {{ displayDate(rejected.date) }}
    </p>
    <p class="mt-1 text-sm text-ink-muted">
      {{ rejected.reason || 'The PF department can tell you why — raise a query and they will explain.' }}
    </p>
  </div>
</template>
