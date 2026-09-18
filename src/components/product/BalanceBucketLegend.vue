<script setup>
import { ref } from 'vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * The three buckets on a phone, where the desktop's three cards do not fit.
 *
 * A legend rather than three stacked cards, and the swatches are ONE HUE AT THREE WEIGHTS rather than
 * three colours. That is the whole argument of the treatment: member, company and VPF are parts of one
 * total, and giving each its own hue would say they are separate categories a member has to compare.
 *
 * The contribution/interest split moves behind the footer row for the same reason it is collapsed on
 * desktop — twelve figures is the system's model of this money, not the member's.
 */
defineProps({
  buckets: { type: Object, required: true },
})

const rows = [
  { key: 'member', label: 'Your contribution', swatch: 'var(--color-bucket-1)' },
  { key: 'company', label: 'Company contribution', swatch: 'var(--color-bucket-2)' },
  { key: 'vpf', label: 'Voluntary (VPF)', swatch: 'var(--color-bucket-3)' },
]

const open = ref(false)
</script>

<template>
  <div>
    <dl class="flex flex-col gap-2 border-t border-border-subtle pt-[15px]">
      <div v-for="row in rows" :key="row.key" class="flex items-center justify-between gap-3">
        <dt class="flex items-center gap-[9px] text-sm">
          <span class="size-[9px] shrink-0 rounded-[3px]" :style="{ background: row.swatch }" />
          {{ row.label }}
        </dt>
        <dd><MoneyDisplay :amount="buckets[row.key].total" size="xs" class="!text-[15px] !font-semibold" /></dd>
      </div>
    </dl>

    <button
      class="mt-3 flex min-h-11 w-full items-center justify-between border-t border-border-subtle pt-[13px] text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="text-[13px] text-ink-muted">Contribution and interest for each</span>
      <AppIcon
        name="chevronDown"
        :size="16"
        class="text-ink-muted transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <dl v-if="open" class="mt-1 flex flex-col gap-2.5">
      <div v-for="row in rows" :key="row.key" class="flex items-baseline justify-between gap-3">
        <dt class="text-[13px] text-ink-muted">{{ row.label }}</dt>
        <dd class="flex gap-4 text-right">
          <span class="text-[11px] text-ink-faint"
            >Contributed <MoneyDisplay :amount="buckets[row.key].contributed" size="xs"
          /></span>
          <span class="text-[11px] text-ink-faint"
            >Interest <MoneyDisplay :amount="buckets[row.key].interest" size="xs"
          /></span>
        </dd>
      </div>
    </dl>
  </div>
</template>
