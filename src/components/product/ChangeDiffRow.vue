<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * "On record → should be", side by side.
 *
 * A diff rather than a form, because that is what the reviewer on the other side needs: a clerk seeing
 * only the new value has to look the old one up to know what changed. It also makes the member's own
 * pending state legible — they can see exactly what they asked for.
 */
defineProps({
  label: { type: String, required: true },
  current: { type: String, default: null },
  mono: { type: Boolean, default: false },
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-[13px] font-medium">{{ label }}</p>
    <div class="flex flex-wrap items-end gap-3">
      <div class="min-w-[9rem] flex-1">
        <p class="text-[11.5px] text-ink-faint">On record</p>
        <p
          class="mt-1 min-h-[46px] rounded-[10px] border border-border bg-surface-sub px-3.5 py-3 text-[15px] text-ink-muted"
          :class="mono ? 'font-mono text-sm' : ''"
        >
          {{ current ?? 'Not on record' }}
        </p>
      </div>

      <AppIcon name="arrowIn" :size="16" class="mb-4 shrink-0 text-ink-faint" />

      <div class="min-w-[9rem] flex-1">
        <p class="text-[11.5px] font-medium" style="color: var(--color-brand-700)">Should be</p>
        <div
          class="mt-1 flex min-h-[46px] items-center rounded-[10px] border border-brand-500 bg-surface px-3.5 py-3 text-[15px]"
          :class="mono ? 'font-mono text-sm' : ''"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
