<script setup>
import { RouterLink } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'

/**
 * The passbook. Designed on the canvas (page 2), not yet built.
 *
 * Three things it has to get right when it is, all of them recorded here so they are not rediscovered:
 *
 *  - **Month 0 is the opening balance, not a thirteenth month.** The API's month list is literally
 *    ["OPENING BALANCE","APRIL",...,"MARCH"], and the row gets a brought-forward treatment rather than
 *    sitting in the sequence.
 *  - **Transfer-in credits and loan withdrawals appear inline** as events between the months. They move
 *    the balance, and a member who cannot see them concludes money has gone missing.
 *  - **The interest column is empty all year, on purpose.** Interest is credited once, after March. An
 *    empty column needs saying rather than looking like data that failed to load.
 */
</script>

<template>
  <EmptyState title="The passbook is not built yet">
    Designed on page 2 of the canvas. It needs
    <code class="font-mono text-xs">GET /api/v1/me/contributions</code>, which is Phase 3.
    <template #action>
      <RouterLink to="/" class="text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to the dashboard →
      </RouterLink>
    </template>
  </EmptyState>
</template>
