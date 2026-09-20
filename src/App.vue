<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppShell from '@/layouts/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import * as me from '@/api/me'
import { logout } from '@/keycloak/keycloak'
import { supportEmail } from '@/branding/branding'

const identity = ref(null)
const sessionExpired = ref(false)
const notLinked = ref(false)

const onExpired = () => (sessionExpired.value = true)
const onNotLinked = () => (notLinked.value = true)

onMounted(() => {
  window.addEventListener('ess:session-expired', onExpired)
  window.addEventListener('ess:account-not-linked', onNotLinked)
  me.getIdentity()
    .then((data) => (identity.value = data))
    .catch(() => {})
})

onUnmounted(() => {
  window.removeEventListener('ess:session-expired', onExpired)
  window.removeEventListener('ess:account-not-linked', onNotLinked)
})

/**
 * The one screen where a member cannot raise a query instead: Help needs a PF record too, and this
 * screen exists precisely because there is not one. So the email address is the only way out of it,
 * and it comes from the tenant rather than from a literal -- an address hard-coded here would send
 * every tenant's new joiners to one trust's inbox.
 *
 * Absent, the button is not rendered: a mailto: with no address is a worse dead end than no button.
 */
const email = computed(() => supportEmail())
</script>

<template>
  <!--
    The unlinked login. Not a 404 and not an error page: the sign-in worked, and what is missing is the
    link from the Keycloak account to an employee record. Usually a new joiner whose SAP import has not
    run yet, which is why the copy says when it will resolve itself.
  -->
  <div v-if="notLinked" class="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
    <h1 class="font-display text-2xl text-ink">We cannot find your PF account</h1>
    <p class="mt-3 text-sm text-ink-muted">
      You are signed in, but no provident fund account is linked to this login. If you joined recently
      your record may not have reached us yet — it usually arrives within a month of your first salary.
    </p>
    <div class="mt-6 flex gap-3">
      <AppButton v-if="email" variant="primary" :href="`mailto:${email}`">
        Email the PF department
      </AppButton>
      <AppButton variant="ghost" @click="logout()">Sign out</AppButton>
    </div>
  </div>

  <AppShell v-else :identity="identity" />

  <!--
    The most common failure this portal will have, and it is a modal rather than a redirect on purpose:
    a member three steps into an advance application keeps what they have filled in.

    It only ever appears because the API echoes the ESS origin on its 401 path. Without that entry in
    SecurityConfiguration the 401 arrives as an opaque CORS error and this never fires.
  -->
  <div
    v-if="sessionExpired"
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-sm rounded-card bg-surface p-6 shadow-card">
      <h2 class="text-base font-semibold text-ink">Still there?</h2>
      <p class="mt-2 text-sm text-ink-muted">
        You have been signed out for security.
        <strong class="font-medium text-ink">Everything you have filled in is kept</strong> — sign in
        again and you will land back on this step.
      </p>
      <AppButton class="mt-5 w-full" @click="$router.go(0)">Sign in again</AppButton>
    </div>
  </div>
</template>
