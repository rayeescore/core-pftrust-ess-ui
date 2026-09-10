<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import * as me from '@/api/me'
import AppBanner from '@/components/ui/AppBanner.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import DetailRow from '@/components/product/DetailRow.vue'

/**
 * Everything the trust holds about the member — and, crucially, **read only**.
 *
 * That is not a shortcut. Employees are created by the SAP import and the only way any of it changes is
 * a *correction request* the PF department reviews and applies. So every field offers one rather than
 * an input, and what has already been asked for sits at the top: a member who has raised a request
 * should not be invited to raise it again as though nothing happened, and a refusal's reason is the
 * whole point of storing one.
 *
 * The nominee total is the one validation a member can actually fail, and it is why the dashboard shows
 * a warning. Saying what happens if it stays unassigned — the share is decided by law rather than by
 * them — is the part that makes somebody act on it.
 */
const router = useRouter()

const profile = ref(null)
const requests = ref([])
const withdrawing = ref(null)
const requestError = ref('')

onMounted(async () => {
  const [loadedProfile, loadedRequests] = await Promise.all([me.getProfile(), me.getChangeRequests()])
  profile.value = loadedProfile
  requests.value = loadedRequests
})

/** `pending` comes from the API -- the label is written for people and is not something to branch on. */
const pending = computed(() => requests.value.filter((request) => request.pending))
const decided = computed(() => requests.value.filter((request) => !request.pending).slice(0, 3))

/** "Mobile number, Nominee · Rohan Deshmukh" -- the labels are the server's, so two screens agree. */
function summary(request) {
  return request.items
    .map((item) => (item.subject ? `${item.label} · ${item.subject}` : item.label))
    .join(', ')
}

function correct() {
  router.push('/profile/corrections')
}

/**
 * The proof the member attached, so they can check they sent the right page.
 *
 * Fetched through the authenticated client and handed to the browser as an object URL, never as a
 * plain link -- the API is bearer-only, so an <a href> would land on a 401 in a blank tab.
 */
async function openProof(request) {
  requestError.value = ''
  try {
    const blob = await me.getChangeRequestAttachment(request.id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (failure) {
    requestError.value =
      failure.response?.data?.message ?? 'Could not open that attachment. Try again in a moment.'
  }
}

async function withdraw(request) {
  withdrawing.value = request.id
  requestError.value = ''
  try {
    const updated = await me.withdrawChangeRequest(request.id)
    requests.value = requests.value.map((each) => (each.id === updated.id ? updated : each))
  } catch (failure) {
    requestError.value =
      failure.response?.data?.message ?? 'That did not go through. Try again in a moment.'
  } finally {
    withdrawing.value = null
  }
}
</script>

<template>
  <div v-if="profile" class="flex flex-col gap-5">
    <header class="flex flex-col gap-1.5">
      <h1 class="font-display text-[30px] leading-[1.15]">Your details</h1>
      <p class="max-w-[72ch] text-sm leading-relaxed text-ink-muted">
        Held by the trust and used on every statement, advance and settlement. The PF department keeps
        these in step with payroll — ask them to change anything that is wrong.
      </p>
    </header>

    <!-- What has already been asked for, before the details it is about. -->
    <AppBanner
      v-for="request in pending"
      :key="request.id"
      tone="info"
      :title="`A correction is under review — asked ${request.raisedOn}`"
    >
      {{ summary(request) }}
      <template #action>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            :disabled="withdrawing === request.id"
            class="min-h-11 rounded-lg border border-border-strong bg-surface px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-surface-sub disabled:opacity-60"
            @click="withdraw(request)"
          >
            {{ withdrawing === request.id ? 'Withdrawing…' : 'Withdraw it' }}
          </button>
          <button
            v-if="request.hasAttachment"
            type="button"
            class="min-h-11 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
            @click="openProof(request)"
          >
            View the proof you sent
          </button>
        </div>
      </template>
    </AppBanner>
    <p v-if="requestError" class="text-[12.5px] text-danger-700">{{ requestError }}</p>

    <div class="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div class="flex flex-col gap-5">
        <section class="rounded-card border border-border bg-surface px-6 py-5">
          <div class="mb-1 flex items-baseline justify-between gap-3">
            <h2 class="eyebrow">About you</h2>
            <RouterLink
              to="/profile/corrections"
              class="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Request a correction
            </RouterLink>
          </div>
          <DetailRow label="Name" :value="profile.name" />
          <DetailRow label="Date of birth" :value="profile.dateOfBirth" />
          <DetailRow label="PAN" :value="profile.pan" mono reveal />
          <DetailRow label="Aadhaar" :value="profile.aadhaar" mono reveal />
          <DetailRow label="Mobile" :value="profile.mobile" action="Change" @action="correct" />
          <DetailRow label="Email" :value="profile.email" action="Change" @action="correct" />
          <DetailRow
            label="Alternate mobile"
            :value="profile.alternateMobile"
            :action="profile.alternateMobile ? 'Change' : 'Add'"
            @action="correct"
          />
          <DetailRow
            label="Alternate email"
            :value="profile.alternateEmail"
            :action="profile.alternateEmail ? 'Change' : 'Add'"
            @action="correct"
          />
        </section>

        <section class="rounded-card border border-border bg-surface px-6 py-5">
          <h2 class="eyebrow mb-1">Your membership</h2>
          <DetailRow label="PF number" :value="profile.pfNumber" mono />
          <DetailRow label="PERN" :value="profile.pernNumber" mono />
          <DetailRow label="UAN" :value="profile.uanNumber" mono />
          <DetailRow label="Token number" :value="profile.tokenNumber" mono />
          <DetailRow label="Joined the company" :value="profile.joinedCompany" />
          <DetailRow label="Joined the fund" :value="profile.joinedFund" />
          <DetailRow label="Unit · location · department" :value="profile.unit" />
        </section>

        <section class="rounded-card border border-border bg-surface px-6 py-5">
          <div class="mb-3 flex items-baseline justify-between gap-3">
            <h2 class="eyebrow">Where you worked before</h2>
            <button class="text-[12.5px] font-semibold text-brand-600">Add an employer</button>
          </div>
          <div v-if="profile.previousEmployers.length" class="flex flex-col gap-3">
            <div
              v-for="employer in profile.previousEmployers"
              :key="employer.name"
              class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div>
                <p class="text-[13.5px] font-medium">{{ employer.name }}</p>
                <p class="tabular text-[11.5px] text-ink-faint">{{ employer.period }}</p>
              </div>
              <span
                class="flex items-center gap-2 text-[11.5px]"
                :class="employer.done ? 'text-success-700' : 'text-info-700'"
              >
                <span
                  class="size-1.5 rounded-full"
                  :class="employer.done ? 'bg-success-500' : 'bg-info-500'"
                />
                {{ employer.status }}
              </span>
            </div>
          </div>
          <p v-else class="text-[13px] text-ink-faint italic">
            Not on record. Earlier employment was never captured by the importer that created these
            records — tell the PF department if you had a PF account elsewhere.
          </p>
        </section>
      </div>

      <aside class="flex flex-col gap-5">
        <section class="rounded-card border border-border bg-surface px-6 py-5">
          <div class="mb-3 flex items-baseline justify-between gap-3">
            <h2 class="eyebrow">Your nominees</h2>
            <RouterLink
              to="/profile/corrections"
              class="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
              >Change</RouterLink
            >
          </div>

          <div class="flex flex-col gap-2.5">
            <div
              v-for="nominee in profile.nominees"
              :key="nominee.name"
              class="flex items-center justify-between gap-3"
            >
              <div>
                <p class="text-[13.5px] font-medium">{{ nominee.name }}</p>
                <p class="text-[11.5px] text-ink-faint">{{ nominee.relationship }}</p>
              </div>
              <p class="tabular text-sm font-semibold">{{ nominee.share }}%</p>
            </div>
          </div>

          <div class="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <p class="text-[13px] text-ink-muted">Assigned</p>
            <p class="tabular text-sm font-semibold" :class="profile.nomineeTotal < 100 ? 'text-warning-700' : ''">
              {{ profile.nomineeTotal }}%
            </p>
          </div>

          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-track">
            <div
              class="h-full rounded-full"
              :class="profile.nomineeTotal < 100 ? 'bg-warning-500' : 'bg-success-500'"
              :style="{ width: `${profile.nomineeTotal}%` }"
            />
          </div>

          <!-- The consequence, not just the number. This is what makes somebody act on it. -->
          <p v-if="profile.nomineeTotal < 100" class="mt-3 text-xs leading-[1.55] text-ink-muted">
            The remaining
            <span class="font-semibold text-ink">{{ 100 - profile.nomineeTotal }}%</span> is not
            assigned to anyone. If it is still unassigned when a claim is made, that share is decided by
            law rather than by you.
          </p>
        </section>

        <section class="rounded-card border border-border bg-surface px-6 py-5">
          <div class="mb-3 flex items-baseline justify-between gap-3">
            <h2 class="eyebrow">Where money is paid</h2>
            <RouterLink
              to="/profile/corrections"
              class="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
              >Request a change</RouterLink
            >
          </div>
          <template v-if="profile.bank">
            <p class="text-[14.5px] font-medium">{{ profile.bank.name }}</p>
            <p class="text-[13px] text-ink-muted">{{ profile.bank.branch }}</p>
            <p class="mt-2 font-mono text-[13px]">{{ profile.bank.account }}</p>
            <p class="font-mono text-[12.5px] text-ink-muted">{{ profile.bank.codes }}</p>
          </template>
          <!-- A member SAP sent no bank row for. The trust's gap, and a correction is how it is closed. -->
          <p v-else class="text-[13px] text-ink-faint italic">
            Not on record. Send us your account details and a cancelled cheque.
          </p>

          <p class="mt-3 flex items-start gap-2 rounded-lg bg-surface-sub px-3 py-2.5 text-xs leading-[1.5] text-ink-muted">
            <AppIcon name="lock" :size="14" class="mt-px shrink-0" />
            A bank change is verified against a cancelled cheque before any money moves.
          </p>
        </section>

        <!-- A refusal's reason is why one is stored. It sits here, where the member looks. -->
        <section v-if="decided.length" class="rounded-card border border-border bg-surface px-6 py-5">
          <h2 class="eyebrow mb-3">Corrections you asked for</h2>
          <div class="flex flex-col gap-3">
            <div
              v-for="request in decided"
              :key="request.id"
              class="flex flex-col gap-1.5 border-b border-border-subtle pb-3 last:border-0 last:pb-0"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="text-[13px] leading-[1.5]">{{ summary(request) }}</p>
                <StatusChip :label="request.status.label" :tone="request.status.tone" />
              </div>
              <p class="tabular text-[11.5px] text-ink-faint">
                Asked {{ request.raisedOn }}<span v-if="request.decidedOn"> · decided {{ request.decidedOn }}</span>
              </p>
              <p v-if="request.decisionReason" class="text-[12.5px] leading-[1.5] text-ink-muted">
                {{ request.decisionReason }}
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>

  <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
</template>
