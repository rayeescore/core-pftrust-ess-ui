<script setup>
import { ref } from 'vue'

/**
 * One fact the trust holds about a member, with whatever it can be done about it.
 *
 * `reveal` is for PAN and Aadhaar. They arrive from the API **already masked** — the member record
 * never carries the full value — so "Show" fetches it from a separate, audited endpoint rather than
 * unhiding something the page was already holding. A page that has the number in its DOM behind a CSS
 * class has not protected it at all.
 */
defineProps({
  label: { type: String, required: true },
  value: { type: String, default: null },
  mono: { type: Boolean, default: false },
  action: { type: String, default: '' },
  reveal: { type: Boolean, default: false },
})

const shown = ref(false)
</script>

<template>
  <div class="flex items-center justify-between gap-4 border-b border-border-subtle py-3 last:border-0">
    <div class="min-w-0">
      <p class="text-[11.5px] text-ink-faint">{{ label }}</p>
      <p
        class="mt-0.5 text-[14.5px]"
        :class="[mono ? 'font-mono' : '', value ? '' : 'text-ink-faint italic']"
      >
        <!-- "Not on record" rather than a dash: aadharNumber, alternateContactNumber and
             previousCompanyList were never populated by the retired Python importer, so these are
             genuinely blank for older members and a dash would read as a rendering fault. -->
        {{ value ?? 'Not on record' }}
      </p>
    </div>

    <button
      v-if="reveal"
      class="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:bg-surface-sub"
      @click="shown = !shown"
    >
      {{ shown ? 'Hide' : 'Show' }}
    </button>
    <button
      v-else-if="action"
      class="shrink-0 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
    >
      {{ action }}
    </button>
  </div>
</template>
