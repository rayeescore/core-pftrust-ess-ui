<script setup>
import { RouterLink } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'

/**
 * A placeholder that says so.
 *
 * Most of the information architecture is designed and not yet built. A route that silently 404s reads
 * as a broken portal; one that says which phase it belongs to reads as work in progress.
 */
</script>

<template>
  <EmptyState title="This screen is not built yet">
    It is designed — see the canvas linked in CLAUDE.md — and it needs the member API under
    <code class="font-mono text-xs">/api/v1/me</code>, which is Phase 3.
    <template #action>
      <RouterLink to="/" class="text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to the dashboard →
      </RouterLink>
    </template>
  </EmptyState>
</template>
