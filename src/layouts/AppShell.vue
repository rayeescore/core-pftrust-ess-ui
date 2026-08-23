<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { logout } from '@/keycloak/keycloak'

/**
 * The frame every screen sits in: identity in the top bar, a left rail on desktop, and a four-item
 * bottom nav on mobile.
 *
 * Content is capped at ~1120px. The admin portal's full-bleed data tables are right for a clerk working
 * a queue all day and wrong for somebody reading their own balance twice a year.
 */
defineProps({
  identity: { type: Object, default: null },
})

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/pf', label: 'My PF' },
  { to: '/profile', label: 'My profile' },
  { to: '/loans', label: 'Loans & advances' },
  { to: '/transfer-in', label: 'Transfer in' },
  { to: '/claims', label: 'Leaving & claims' },
  { to: '/help', label: 'Help & queries' },
  { to: '/trust', label: 'Know your trust' },
]

// Four, because a phone thumb reaches four. Everything else is behind the profile menu.
const mobileNav = [
  { to: '/', label: 'Home' },
  { to: '/pf', label: 'My PF' },
  { to: '/loans', label: 'Apply' },
  { to: '/help', label: 'Help' },
]

const menuOpen = ref(false)
</script>

<template>
  <div class="min-h-dvh">
    <header class="no-print sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-4">
        <RouterLink to="/" class="flex items-baseline gap-2">
          <span class="text-base font-semibold text-brand-500">CorePF Trust</span>
          <span class="hidden text-sm text-ink-faint sm:inline">Member portal</span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <!-- Hindi and Marathi are on the roadmap; both type faces already carry Devanagari. -->
          <button
            class="rounded-sm px-2 py-1 text-xs font-medium text-ink-muted hover:bg-surface-deep"
            aria-label="Change language"
          >
            EN
          </button>

          <div class="relative">
            <button
              class="flex size-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
              :aria-expanded="menuOpen"
              @click="menuOpen = !menuOpen"
            >
              {{ (identity?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('') }}
            </button>

            <div
              v-if="menuOpen"
              class="absolute right-0 mt-2 w-56 rounded-card bg-surface p-2 shadow-card ring-1 ring-border"
            >
              <p class="px-2 py-1.5 text-sm font-medium text-ink">{{ identity?.name }}</p>
              <p class="px-2 pb-2 font-mono text-xs text-ink-faint">PF {{ identity?.pfNumber }}</p>
              <button
                class="w-full rounded-sm px-2 py-2 text-left text-sm text-ink-muted hover:bg-surface-deep"
                @click="logout()"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto flex max-w-[1120px] gap-8 px-4 py-6">
      <nav class="no-print hidden w-56 shrink-0 lg:block">
        <ul class="sticky top-20 space-y-0.5">
          <li v-for="item in nav" :key="item.to">
            <RouterLink
              :to="item.to"
              class="block rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-surface-deep hover:text-ink"
              active-class="bg-brand-50 font-medium text-brand-700 hover:bg-brand-50"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- pb-20 clears the mobile bottom nav, which is fixed. -->
      <main class="min-w-0 flex-1 pb-20 lg:pb-0">
        <RouterView />
      </main>
    </div>

    <nav
      class="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-surface lg:hidden"
    >
      <RouterLink
        v-for="item in mobileNav"
        :key="item.to"
        :to="item.to"
        class="flex h-16 flex-col items-center justify-center text-xs text-ink-muted"
        active-class="text-brand-600 font-medium"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>
