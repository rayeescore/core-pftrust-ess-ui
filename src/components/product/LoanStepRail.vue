<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * The five steps of an advance application, and where the member is in them.
 *
 * Steps already behind them show a tick rather than their number — the number is only useful while it
 * is still ahead of you. Nothing here is clickable forward: a member cannot skip to Documents before
 * naming a purpose, because the required document set is decided by the purpose.
 */
defineProps({
  current: { type: Number, required: true },
})

const steps = ['Purpose', 'Amount', 'Details', 'Documents', 'Review']
</script>

<template>
  <ol class="mb-6 flex flex-wrap items-center gap-2">
    <template v-for="(label, index) in steps" :key="label">
      <li
        class="flex items-center gap-2 rounded-full py-[7px]"
        :class="
          index + 1 === current
            ? 'bg-action-fill pr-[15px] pl-[9px] text-on-brand'
            : 'px-[9px] text-ink-faint'
        "
      >
        <span
          class="flex size-5 items-center justify-center rounded-full text-[11.5px] font-semibold"
          :class="
            index + 1 === current
              ? 'bg-white/25'
              : index + 1 < current
                ? 'bg-success-500 text-white'
                : 'border border-border-strong'
          "
        >
          <AppIcon v-if="index + 1 < current" name="check" :size="11" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="text-[13px]" :class="index + 1 === current ? 'font-semibold' : ''">
          {{ label }}
        </span>
      </li>
      <li
        v-if="index < steps.length - 1"
        class="hidden h-px w-[18px] sm:block"
        style="background: oklch(0.87 0.008 78)"
        aria-hidden="true"
      />
    </template>
  </ol>
</template>
