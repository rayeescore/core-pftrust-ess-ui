<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import * as me from '@/api/me'
import { changeOf, partition, summary, title } from '@/composables/useChangeRequests'
import { downloadFailure, saveFile } from '@/composables/useDownload'
import { displayDate } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'

/**
 * Every correction the member has ever asked for, and what came of it.
 *
 * The brief asked for the change request to have "its own status chip **and history**, mirroring the
 * loan flow" (§2.4), and the history was the half that was never built: the profile showed pending
 * requests as banners and then the three most recent decided ones, so a member's fourth correction
 * became unreachable the day they raised a fifth. This is that list, and it is the only screen that
 * shows a request in full.
 *
 * **It reads `GET /me/change-requests` and nothing else.** That handler already returns the whole
 * history, newest first, with every before-and-after pair, the decision reason and whether proof is
 * on file -- which is why there is no detail route here and no call to `getChangeRequest(id)`. A row
 * that expands in place shows exactly what a detail page would, without a second fetch that could
 * fail on its own.
 *
 * `/profile/corrections` stays the form. Three links on the profile point at it and so do two alerts
 * built server-side in `MemberDashboardController`, so the path a member arrives on from "your
 * nomination is incomplete" has to keep meaning "the form" rather than "a list of what you have
 * already sent".
 */
const requests = ref(null)
const failed = ref(false)
const expanded = ref(new Set())
const withdrawing = ref(null)
const rowError = ref({})

onMounted(async () => {
  try {
    const loaded = await me.getChangeRequests()

    // Open the ones still under review. They are the only rows carrying an action, and a member who
    // came here to withdraw something should not have to hunt for it behind a chevron.
    expanded.value = new Set(partition(loaded).pending.map((request) => request.id))
    requests.value = loaded
  } catch {
    failed.value = true
  }
})

const isOpen = (id) => expanded.value.has(id)

function toggle(id) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

/** Mono for the things read digit by digit, where a proportional font makes two values hard to compare. */
const MONO_FIELDS = new Set([
  'MOBILE',
  'ALTERNATE_MOBILE',
  'BANK_ACCOUNT_NUMBER',
  'BANK_IFSC',
  'BANK_MICR',
])

/**
 * The before-and-after pairs of one request, ready to draw.
 *
 * A nominee's share is a bare number on the wire and a percentage everywhere a member meets it -- the
 * correction form puts the sign beside the box -- so it is put back here. Only on a value that is
 * actually a number: "Removed" and "Not on record" are words, and "Removed%" is not a thing.
 */
function rowsOf(request) {
  return (request.items ?? []).map((item, index) => {
    const change = changeOf(item)
    const unit = item.field === 'NOMINEE' ? '%' : ''

    return {
      key: `${item.field}-${item.subject ?? index}`,
      label: title(item),
      mono: MONO_FIELDS.has(item.field),
      from: change.added ? change.from : `${change.from}${unit}`,
      to: change.removed ? change.to : `${change.to}${unit}`,
    }
  })
}

function noteError(id, message) {
  rowError.value = { ...rowError.value, [id]: message }
}

/**
 * Saves the proof the member attached, so they can check they sent the right page.
 *
 * Fetched through the authenticated client and saved rather than opened, for the two reasons
 * `useDownload` exists: the API is bearer-only, so a plain link lands on a 401 in a blank tab, and by
 * the time the bytes arrive the click's user activation has usually lapsed and a popup blocker refuses
 * the tab anyway.
 */
async function saveProof(request) {
  noteError(request.id, '')
  try {
    const { blob, filename } = await me.getChangeRequestAttachment(request.id)
    saveFile(blob, filename)
  } catch (error) {
    noteError(request.id, await downloadFailure(error))
  }
}

/**
 * "Never mind."
 *
 * The row is replaced with what the API answers rather than patched locally: withdrawing sets the
 * status, the decided date and `pending` together, and re-reading them from the response is what keeps
 * the chip, the dates and the disappearance of this very button in step with the server.
 */
async function withdraw(request) {
  withdrawing.value = request.id
  noteError(request.id, '')
  try {
    const updated = await me.withdrawChangeRequest(request.id)
    requests.value = requests.value.map((each) => (each.id === updated.id ? updated : each))
  } catch (failure) {
    noteError(
      request.id,
      failure.response?.data?.message ?? 'That did not go through. Try again in a moment.',
    )
  } finally {
    withdrawing.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-[22px]">
    <header class="flex flex-wrap items-end justify-between gap-7">
      <div class="flex flex-col gap-[7px]">
        <h1 class="font-display text-[25px] leading-[1.15] sm:text-[30px]">Corrections you asked for</h1>
        <p class="max-w-[68ch] text-[13.5px] leading-relaxed text-ink-muted">
          Everything you have asked the PF department to put right, and what came of each one.
        </p>
      </div>

      <RouterLink
        to="/profile/corrections"
        class="flex min-h-11 shrink-0 items-center gap-[9px] rounded-[10px] bg-action-fill px-[18px] py-[11px] text-sm font-semibold text-on-brand transition-colors hover:bg-brand-600"
      >
        <AppIcon name="plus" :size="16" />
        Ask for a correction
      </RouterLink>
    </header>

    <!-- A list that fails says so where the list is, and leaves the rail and the header alone. -->
    <div
      v-if="failed"
      class="rounded-card border border-danger-200 bg-danger-50 px-6 py-5 text-[13.5px] text-danger-700"
    >
      We could not load your corrections just now. Refresh the page, and tell the PF department if it
      keeps happening.
    </div>

    <div v-else-if="requests === null" class="h-64 animate-pulse rounded-card bg-surface-deep" />

    <EmptyState v-else-if="!requests.length" title="You have not asked for a correction">
      Your details come from payroll, so nothing here can be edited directly. If something is wrong —
      a mobile number, your bank account, who you have nominated — ask the PF department to change it
      and it will appear here.
      <template #action>
        <RouterLink
          to="/profile/corrections"
          class="inline-flex min-h-11 items-center gap-[9px] rounded-[10px] bg-action-fill px-[18px] text-sm font-semibold text-on-brand transition-colors hover:bg-brand-600"
        >
          <AppIcon name="plus" :size="16" />
          Ask for a correction
        </RouterLink>
      </template>
    </EmptyState>

    <div v-else class="flex flex-col gap-3">
      <article
        v-for="request in requests"
        :key="request.id"
        class="overflow-hidden rounded-card border border-border bg-surface"
      >
        <button
          type="button"
          class="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-sub"
          :aria-expanded="isOpen(request.id)"
          @click="toggle(request.id)"
        >
          <AppIcon
            :name="isOpen(request.id) ? 'chevronDown' : 'chevronRight'"
            :size="15"
            class="mt-1 shrink-0 text-ink-faint"
          />
          <div class="min-w-0 flex-1">
            <p class="text-[13.5px] leading-[1.5] font-medium">{{ summary(request) }}</p>
            <p class="tabular mt-0.5 text-[11.5px] text-ink-faint">
              Asked {{ displayDate(request.raisedOn) }}
              <span v-if="request.decidedOn"> · decided {{ displayDate(request.decidedOn) }}</span>
            </p>
          </div>
          <StatusChip :label="request.status.label" :tone="request.status.tone" />
        </button>

        <div v-if="isOpen(request.id)" class="flex flex-col gap-4 border-t border-border px-5 py-4">
          <!-- What was actually asked for. The old value beside the new one, because a member checking
               a request weeks later has forgotten what the old one was. -->
          <div v-if="request.items?.length" class="flex flex-col gap-3">
            <div v-for="row in rowsOf(request)" :key="row.key" class="flex flex-col gap-1">
              <p class="text-[11.5px] text-ink-faint">{{ row.label }}</p>
              <!-- `min-w-0 break-words` on both values, not decoration: an email address has no space
                   to break at, and a flex child wider than the line overflows the page rather than
                   wrapping. A 320px phone has about 130px of line here. -->
              <div class="flex flex-wrap items-center gap-2.5">
                <span
                  class="min-w-0 break-words text-[13.5px] text-ink-muted"
                  :class="row.mono ? 'font-mono text-[12.5px]' : ''"
                  >{{ row.from }}</span
                >
                <AppIcon name="arrowIn" :size="14" class="shrink-0 text-ink-faint" />
                <span
                  class="min-w-0 break-words text-[13.5px] font-medium"
                  :class="row.mono ? 'font-mono text-[12.5px]' : ''"
                  >{{ row.to }}</span
                >
              </div>
            </div>
          </div>

          <div v-if="request.note" class="rounded-xl bg-surface-sub px-4 py-3">
            <p class="text-[11.5px] text-ink-faint">What you told them</p>
            <p class="mt-1 text-[13px] leading-[1.55]">{{ request.note }}</p>
          </div>

          <!-- A refusal's reason is the whole point of storing one. -->
          <div
            v-if="request.decisionReason"
            class="rounded-xl px-4 py-3"
            :class="request.status.tone === 'danger' ? 'bg-danger-50' : 'bg-surface-sub'"
          >
            <p
              class="text-[11.5px]"
              :class="request.status.tone === 'danger' ? 'text-danger-700' : 'text-ink-faint'"
            >
              What the PF department said
            </p>
            <p class="mt-1 text-[13px] leading-[1.55]">{{ request.decisionReason }}</p>
          </div>

          <div
            v-if="request.pending || request.hasAttachment"
            class="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-3"
          >
            <button
              v-if="request.pending"
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
              class="flex min-h-11 items-center gap-2 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
              @click="saveProof(request)"
            >
              <AppIcon name="download" :size="14" />
              View the proof you sent
            </button>
          </div>

          <!-- Beside the button that failed, never in a toast over a list of ten. -->
          <p v-if="rowError[request.id]" class="text-[12.5px] text-danger-700">
            {{ rowError[request.id] }}
          </p>
        </div>
      </article>
    </div>
  </div>
</template>
