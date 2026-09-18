<script setup>
/**
 * Months posted across the financial year, April to March.
 *
 * A posted month is a full-height brand bar; a month still to come is a 12px stub in the track colour.
 * The distinction is doing real work — it is the difference between "we have not credited this yet" and
 * "you contributed nothing", and a zero-height bar would say the second.
 *
 * No axis and no values: this is a progress indicator through the year, not a chart of amounts. The
 * amounts live in the passbook, one tap away.
 *
 * The month labels are desktop-only. Twelve three-letter labels need about 300px and a phone card gives
 * them ~220, so each one spilled out of its cell -- on a 320px screen the row ran 36px past the edge of
 * the document. DashboardMobile draws the bars without labels for the same reason, and the card already
 * says "4 of 12 months posted" above them.
 */
defineProps({
  monthsPosted: { type: Number, default: 0 },
})

// April first. A financial year runs April to March, and rendering it January-first would be the
// convention this system keeps getting wrong.
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex h-[74px] items-end gap-[5px] sm:gap-2">
      <div v-for="(month, index) in MONTHS" :key="month" class="flex h-full flex-1 items-end">
        <span
          v-if="index < monthsPosted"
          class="w-full rounded-t-md rounded-b-[2px] bg-brand-500"
          style="height: 100%"
        />
        <span v-else class="h-3 w-full rounded" style="background: var(--color-border-subtle)" />
      </div>
    </div>
    <div class="hidden gap-2 sm:flex">
      <div
        v-for="(month, index) in MONTHS"
        :key="month"
        class="flex-1 text-center text-[11px]"
        :class="index < monthsPosted ? 'text-ink-muted' : 'text-ink-faintest'"
      >
        {{ month }}
      </div>
    </div>
  </div>
</template>
