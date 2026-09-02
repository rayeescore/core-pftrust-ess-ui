<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * One required document, with its own slot.
 *
 * A named checklist rather than a generic multi-file dropzone, and the difference matters at the other
 * end: a clerk opening a pile of five untitled PDFs has to work out which is the Sale Agreement, and a
 * member who uploaded four of five has no way to see which one is missing.
 *
 * The `rejected` state exists because a scan the PF department cannot read comes back — and today
 * UploadedDocument has nowhere to store that outcome, which is still open backend work.
 *
 * The file input is hidden and driven by the visible button rather than shown: a bare `<input
 * type="file">` cannot be styled and reads as a different control on every browser, and this one has
 * to sit inside a row that already has its own shape. The button carries the 44px hit target.
 */
const props = defineProps({
  document: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['upload', 'view'])

const input = ref(null)

function choose() {
  input.value?.click()
}

function chosen(event) {
  const file = event.target.files?.[0]
  if (file) emit('upload', file)
  // Cleared so choosing the same file twice in a row still fires a change event -- which is exactly
  // what a member does after a failed upload.
  event.target.value = ''
}
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
      <input
        ref="input"
        type="file"
        class="hidden"
        accept="application/pdf,image/jpeg,image/png"
        @change="chosen"
      />

      <span v-if="busy" class="text-[12.5px] text-ink-faint">Uploading…</span>

      <template v-else-if="document.state === 'attached'">
        <button
          class="min-h-11 text-[12.5px] font-medium text-brand-700 hover:text-brand-600"
          @click="emit('view')"
        >
          View
        </button>
        <button
          class="min-h-11 text-[12.5px] font-medium text-ink-muted hover:text-ink"
          @click="choose"
        >
          Replace
        </button>
      </template>

      <button
        v-else
        class="flex min-h-11 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-surface-sub"
        @click="choose"
      >
        <AppIcon name="upload" :size="14" />
        {{ document.state === 'rejected' ? 'Retry' : 'Upload' }}
      </button>
    </div>
  </div>
</template>
