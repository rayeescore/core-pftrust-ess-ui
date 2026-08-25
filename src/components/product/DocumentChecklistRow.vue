<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * One required document, with its own slot.
 *
 * A named checklist rather than a generic multi-file dropzone, and the difference matters at the other
 * end: a clerk opening a pile of five untitled PDFs has to work out which is the Sale Agreement, and a
 * member who uploaded four of five has no way to see which one is missing.
 *
 * The `rejected` state exists because a scan the PF department cannot read comes back — and today
 * UploadedDocument has nowhere to store that outcome, which is one of the gaps Phase 3 has to close.
 */
defineProps({
  document: { type: Object, required: true },
})
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3.5"
    :class="
      document.state === 'rejected'
        ? 'border-danger-200 bg-danger-50'
        : document.state === 'attached'
          ? 'border-border bg-surface-sub'
          : 'border-border bg-surface'
    "
  >
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-lg"
        :class="
          document.state === 'attached'
            ? 'bg-success-50 text-success-700'
            : document.state === 'rejected'
              ? 'bg-danger-50 text-danger-700'
              : 'bg-surface-deep text-ink-faint'
        "
      >
        <AppIcon :name="document.state === 'attached' ? 'check' : 'file'" :size="16" />
      </span>
      <div class="min-w-0">
        <p class="text-[13.5px] font-medium">{{ document.name }}</p>
        <p
          class="truncate text-[11.5px]"
          :class="document.state === 'rejected' ? 'text-danger-700' : 'text-ink-faint'"
        >
          {{ document.detail }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <template v-if="document.state === 'attached'">
        <button class="text-[12.5px] font-medium text-brand-700 hover:text-brand-600">View</button>
        <button class="text-[12.5px] font-medium text-ink-muted hover:text-ink">Replace</button>
      </template>
      <button
        v-else
        class="flex min-h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-surface-sub"
      >
        <AppIcon name="upload" :size="14" />
        {{ document.state === 'rejected' ? 'Retry' : 'Upload' }}
      </button>
    </div>
  </div>
</template>
