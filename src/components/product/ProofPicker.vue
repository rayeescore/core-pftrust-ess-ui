<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * One document, attached to the section that needs it.
 *
 * A change request carries exactly one file, so a nominee change and a bank change are sent as two
 * requests and each section asks for its own proof -- the nomination form under the nominees, the
 * cheque under the bank account -- rather than one button below both asking for two documents at once.
 */
defineProps({
  /** What to attach, in the server's own words: "a signed nomination form". */
  document: { type: String, required: true },
})

const file = defineModel({ type: [Object, null], default: null })
const input = ref(null)

function chosen(event) {
  const picked = event.target.files?.[0]
  if (picked) file.value = picked
  // Cleared so choosing the same file twice in a row still fires a change event -- which is exactly
  // what a member does after picking the wrong page and then the right one.
  event.target.value = ''
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-strong bg-surface-sub px-4 py-3.5"
  >
    <div class="min-w-0">
      <p class="text-[13.5px] font-medium">Proof for this change</p>
      <p class="text-[11.5px] text-ink-muted">Attach {{ document }}. A PDF or a photograph, up to 5 MB.</p>
    </div>
    <button
      type="button"
      class="flex min-h-11 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-surface-sub"
      @click="input?.click()"
    >
      <AppIcon :name="file ? 'check' : 'upload'" :size="14" />
      <span class="max-w-[14rem] truncate">{{ file ? file.name : 'Attach' }}</span>
    </button>
    <input ref="input" type="file" class="hidden" accept="application/pdf,image/jpeg,image/png" @change="chosen" />
  </div>
</template>
