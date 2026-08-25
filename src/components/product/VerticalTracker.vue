<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * The four milestones of an application, drawn vertically with dates.
 *
 * Four rather than three because **two different people must approve**. `ApprovalAccess` enforces that
 * the same person cannot do both stages, so "Checked and approved" and "Second approval" are two
 * genuinely different waits with two different people in them. Collapsing them would make the second
 * look like the first having stalled, which is what members raise queries about.
 *
 * The step in flight pulses, because "waiting since 18 Aug" and "not yet" are different states and a
 * static dot says the same thing for both.
 */
defineProps({
  steps: { type: Array, required: true },
})
</script>

<template>
  <ol class="flex flex-col">
    <li v-for="(step, index) in steps" :key="step.label" class="flex gap-4">
      <div class="flex flex-col items-center">
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-full"
          :class="
            step.state === 'done'
              ? 'bg-success-500 text-white'
              : step.state === 'current'
                ? 'bg-info-500 text-white'
                : 'border border-border bg-surface'
          "
        >
          <AppIcon v-if="step.state === 'done'" name="check" :size="13" />
          <span
            v-else-if="step.state === 'current'"
            class="size-2 animate-pulse rounded-full bg-white"
          />
        </span>
        <span
          v-if="index < steps.length - 1"
          class="w-px flex-1"
          :class="step.state === 'done' ? 'bg-success-500' : 'bg-border'"
          style="min-height: 28px"
        />
      </div>

      <div class="pb-6" :class="index === steps.length - 1 ? '!pb-0' : ''">
        <p class="text-sm font-medium" :class="step.state === 'todo' ? 'text-ink-faint' : ''">
          {{ step.label }}
        </p>
        <p class="tabular mt-0.5 text-xs text-ink-muted">{{ step.when }}</p>
      </div>
    </li>
  </ol>
</template>
