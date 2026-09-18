<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { logout } from '@/keycloak/keycloak'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * The frame every screen sits in: a 64px top bar, a 232px left rail on desktop, and a four-item bottom
 * nav on a phone.
 *
 * The rail is white against a warm off-white page rather than transparent, which is what separates it
 * from the content column without a heavy border. Both come straight from the canvas.
 */
defineProps({
  identity: { type: Object, default: null },
})

// A divider sits before the last two, because they are reference rather than the member's own record.
const nav = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/pf', label: 'My PF', icon: 'passbook' },
  { to: '/profile', label: 'My profile', icon: 'profile' },
  { to: '/loans', label: 'Loans & advances', icon: 'loan' },
  { to: '/transfer-in', label: 'Transfer in', icon: 'transferIn' },
  { to: '/claims', label: 'Leaving & claims', icon: 'claims' },
  { divider: true },
  { to: '/help', label: 'Help & queries', icon: 'help' },
  { to: '/trust', label: 'Know your trust', icon: 'trust' },
]

// Four, because a phone thumb reaches four. Everything else is behind the profile menu.
const mobileNav = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/pf', label: 'My PF', icon: 'passbook' },
  { to: '/loans', label: 'Apply', icon: 'plus' },
  { to: '/help', label: 'Help', icon: 'help' },
]

const menuOpen = ref(false)

const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
</script>

<template>
  <div class="min-h-dvh">
    <!-- TOP BAR -->
    <header class="no-print sticky top-0 z-20 h-16 border-b border-border bg-surface">
      <div class="flex h-full items-center justify-between px-5 sm:px-7">
        <RouterLink to="/" class="flex min-h-11 items-center gap-[11px]">
          <span
            class="flex size-[30px] items-center justify-center rounded-lg bg-brand-500 text-white"
          >
            <AppIcon name="home" :size="17" />
          </span>
          <span class="flex flex-col leading-none">
            <span class="font-display text-base leading-[1.1]">CorePF Trust</span>
            <span class="text-[10.5px] uppercase tracking-[0.07em] text-ink-faint">Member portal</span>
          </span>
        </RouterLink>

        <div class="flex items-center gap-4 sm:gap-[18px]">
          <!-- Hindi and Marathi are on the roadmap; both faces already carry Devanagari. -->
          <button
            class="flex min-h-11 items-center gap-[7px] rounded-full border border-border px-[13px] text-ink-muted transition-colors hover:bg-surface-sub"
            aria-label="Change language"
          >
            <AppIcon name="globe" :size="14" />
            <span class="text-[13px] font-medium text-ink">EN</span>
          </button>

          <div class="relative">
            <button
              class="flex min-h-11 items-center gap-2.5"
              :aria-expanded="menuOpen"
              @click="menuOpen = !menuOpen"
            >
              <span
                class="flex size-8 items-center justify-center rounded-full bg-brand-100 text-[13px] font-semibold text-brand-700"
              >
                {{ initials(identity?.name) }}
              </span>
              <AppIcon name="chevronDown" :size="14" class="text-ink-muted" />
            </button>

            <div
              v-if="menuOpen"
              class="absolute right-0 z-30 mt-3 w-60 rounded-card border border-border bg-surface p-2 shadow-lg"
            >
              <p class="px-2.5 pt-1.5 text-sm font-semibold">{{ identity?.name || '—' }}</p>
              <p class="px-2.5 pb-2.5 font-mono text-[11.5px] text-ink-faint">
                PF {{ identity?.pfNumber || '—' }}
              </p>
              <button
                class="min-h-11 w-full rounded-md px-2.5 text-left text-sm text-ink-soft hover:bg-surface-sub"
                @click="logout()"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="flex items-stretch">
      <!-- LEFT RAIL -->
      <nav class="no-print hidden w-[232px] shrink-0 border-r border-border bg-surface px-3.5 py-[22px] lg:block">
        <ul class="sticky top-[86px] flex flex-col gap-[3px]">
          <li v-for="(item, index) in nav" :key="item.to ?? `divider-${index}`">
            <hr v-if="item.divider" class="mx-3 my-3 border-0 border-t border-border-subtle" />
            <RouterLink
              v-else
              :to="item.to"
              class="flex items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-sub"
              active-class="!bg-brand-50 !text-brand-700 font-semibold"
            >
              <AppIcon :name="item.icon" :size="17" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- pb-24 clears the fixed mobile bottom nav. -->
      <main class="min-w-0 flex-1 px-5 pt-7 pb-24 sm:px-[34px] lg:pb-11">
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
        class="flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-ink-faint"
        active-class="text-brand-600 font-semibold"
      >
        <AppIcon :name="item.icon" :size="19" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>
