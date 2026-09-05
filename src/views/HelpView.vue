<script setup>
import { computed, onMounted, ref } from 'vue'
import * as me from '@/api/me'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusChip from '@/components/ui/StatusChip.vue'

/**
 * Questions to the PF department, as a two-sided conversation.
 *
 * A thread rather than a form, because the ticket module already stores it as one -- subject, category,
 * and comments marked OWNER or OTHER. Rendering that as a support form with a status field would throw
 * away the half of it that members actually use.
 *
 * The member's own question is the first message in the thread, sent that way by the API: it lives on
 * the ticket rather than as a comment, so a thread built only from comments opens with the department
 * replying to something the member cannot see.
 *
 * Only the member can close their own question. The staff handler still lets any TICKET_CREATE holder
 * close anybody's (SECURITY_AUDIT C1, §9 item 12) -- the member one is ownership-checked.
 */
const tickets = ref(null)
const categories = ref([])
const selectedId = ref(null)

const asking = ref(false)
const draft = ref({ subject: '', details: '', category: '' })
const draftFile = ref(null)
const draftFileInput = ref(null)

const reply = ref('')
const replyFile = ref(null)
const replyFileInput = ref(null)

const busy = ref(false)
// Two refs, not one -- a member with no tickets at all has no thread panel, so an ask-form error
// rendered in the footer would render nowhere, and a reply-box error would otherwise land beside
// whichever thread happens to be selected rather than the form that actually failed.
const askError = ref('')
const replyError = ref('')

const selected = computed(() => tickets.value?.find((ticket) => ticket.id === selectedId.value))

onMounted(async () => {
  const [list, list2] = await Promise.all([me.getTickets(), me.getTicketCategories()])
  tickets.value = list
  categories.value = list2
  selectedId.value = list[0]?.id ?? null
})

/** Replace one ticket in the list with the version the API just returned, and keep it selected. */
function absorb(updated) {
  const at = tickets.value.findIndex((ticket) => ticket.id === updated.id)
  if (at >= 0) {
    tickets.value[at] = updated
  } else {
    tickets.value.unshift(updated)
  }
  selectedId.value = updated.id
}

/** Every write goes through here, so one failure path serves all three -- but the message lands
 *  beside the control that failed, which means the caller says where. */
async function run(action, error) {
  busy.value = true
  error.value = ''
  try {
    absorb(await action())
    return true
  } catch (failure) {
    // The API's refusals are written to be read by the member -- a 400 carries its message intact --
    // so it is shown as sent rather than replaced with a generic sentence.
    error.value =
      failure.response?.data?.message ?? 'That did not go through. Try again in a moment.'
    return false
  } finally {
    busy.value = false
  }
}

function toggleAsk() {
  asking.value = !asking.value
  // A stale refusal from a form that was abandoned and reopened should not reappear unearned.
  if (!asking.value) askError.value = ''
}

function chooseDraftFile() {
  draftFileInput.value?.click()
}

function draftFileChosen(event) {
  const file = event.target.files?.[0]
  if (file) draftFile.value = file
  // Cleared so choosing the same file twice in a row still fires a change event -- which is exactly
  // what a member does after a failed send.
  event.target.value = ''
}

function chooseReplyFile() {
  replyFileInput.value?.click()
}

function replyFileChosen(event) {
  const file = event.target.files?.[0]
  if (file) replyFile.value = file
  event.target.value = ''
}

async function ask() {
  if (!draft.value.subject.trim() || !draft.value.details.trim() || !draft.value.category) {
    askError.value = 'A subject, a category and your question — all three.'
    return
  }

  const sent = await run(() => me.createTicket({ ...draft.value }, draftFile.value), askError)

  if (sent) {
    asking.value = false
    draft.value = { subject: '', details: '', category: '' }
    draftFile.value = null
  }
}

async function send() {
  if (!reply.value.trim() && !replyFile.value) {
    replyError.value = 'Write something, or attach a page, before sending.'
    return
  }

  const sent = await run(
    () => me.replyToTicket(selectedId.value, reply.value, replyFile.value),
    replyError,
  )

  if (sent) {
    reply.value = ''
    replyFile.value = null
  }
}

async function settle() {
  await run(() => me.closeTicket(selectedId.value), replyError)
}

const attachmentUrl = me.ticketAttachmentUrl
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-col gap-1.5">
      <h1 class="font-display text-[30px] leading-[1.15]">Your questions</h1>
      <p class="max-w-[72ch] text-sm leading-relaxed text-ink-muted">
        Anything you ask goes to the part of the PF department that handles it, and stays here as a
        conversation until it is settled.
      </p>
    </header>

    <div v-if="tickets" class="grid items-start gap-5 lg:grid-cols-[0.85fr_1.4fr]">
      <div class="flex flex-col gap-2.5">
        <button
          class="flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          @click="toggleAsk"
        >
          <AppIcon :name="asking ? 'x' : 'plus'" :size="17" />
          {{ asking ? 'Never mind' : 'Ask a question' }}
        </button>

        <form
          v-if="asking"
          class="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
          @submit.prevent="ask"
        >
          <label class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-medium text-ink-muted">What is it about?</span>
            <select
              v-model="draft.category"
              class="min-h-11 rounded-[10px] border border-border-strong bg-surface px-3 text-sm outline-none"
            >
              <option value="" disabled>Choose one</option>
              <option v-for="category in categories" :key="category.code" :value="category.code">
                {{ category.label }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-medium text-ink-muted">Subject</span>
            <input
              v-model="draft.subject"
              maxlength="255"
              class="min-h-11 rounded-[10px] border border-border-strong bg-surface px-3.5 text-sm outline-none"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-medium text-ink-muted">Your question</span>
            <textarea
              v-model="draft.details"
              rows="4"
              class="resize-none rounded-[10px] border border-border-strong bg-surface px-3.5 py-3 text-sm outline-none"
            />
          </label>

          <button
            type="button"
            class="flex min-h-11 items-center gap-2 text-[12.5px] font-medium text-ink-muted hover:text-ink"
            @click="chooseDraftFile"
          >
            <AppIcon name="upload" :size="15" />
            <span>{{ draftFile ? draftFile.name : 'Attach a page (optional)' }}</span>
          </button>
          <input
            ref="draftFileInput"
            type="file"
            class="hidden"
            accept="application/pdf,image/jpeg,image/png"
            @change="draftFileChosen"
          />

          <p class="text-[11.5px] text-ink-faint">A PDF or a photograph, up to 5 MB.</p>

          <p v-if="askError" class="text-[12.5px] text-danger-700">{{ askError }}</p>

          <button
            type="submit"
            :disabled="busy"
            class="min-h-11 rounded-[10px] bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {{ busy ? 'Sending…' : 'Send it' }}
          </button>
        </form>

        <p v-if="!tickets.length" class="rounded-xl border border-border bg-surface-sub px-4 py-6 text-center text-[13px] text-ink-muted">
          You have not asked anything yet. Anything about your PF — a number that looks wrong, an
          advance you are waiting on — goes here.
        </p>

        <button
          v-for="ticket in tickets"
          :key="ticket.id"
          class="flex flex-col gap-1.5 rounded-xl border px-4 py-3.5 text-left transition-colors"
          :class="
            selectedId === ticket.id
              ? 'border-brand-500 bg-brand-50'
              : 'border-border bg-surface hover:bg-surface-sub'
          "
          @click="selectedId = ticket.id"
        >
          <span class="flex items-start justify-between gap-3">
            <span class="text-[13.5px] font-semibold">{{ ticket.subject }}</span>
            <StatusChip :label="ticket.status.label" :tone="ticket.status.tone" />
          </span>
          <span class="font-mono text-[11.5px] text-ink-faint">
            {{ ticket.reference }} · {{ ticket.category }}
          </span>
          <span class="tabular text-[11.5px] text-ink-faint">{{ ticket.lastActivity }}</span>
        </button>
      </div>

      <section v-if="selected" class="rounded-card border border-border bg-surface">
        <header class="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div>
            <h2 class="text-[17px] font-semibold">{{ selected.subject }}</h2>
            <p class="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-faint">
              <span class="font-mono">{{ selected.reference }}</span>
              <span class="size-[3px] rounded-full bg-border-strong" />
              <span>{{ selected.category }}</span>
              <span class="size-[3px] rounded-full bg-border-strong" />
              <span class="tabular">Asked {{ selected.askedOn }}</span>
            </p>
          </div>
          <StatusChip :label="selected.status.label" :tone="selected.status.tone" />
        </header>

        <div class="flex flex-col gap-4 px-6 py-5">
          <div
            v-for="(message, index) in selected.messages"
            :key="index"
            class="flex"
            :class="message.from === 'you' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[36rem] rounded-xl px-4 py-3"
              :class="
                message.from === 'you'
                  ? 'bg-brand-50 text-ink'
                  : 'border border-border bg-surface-sub'
              "
            >
              <p v-if="message.body" class="text-[13.5px] leading-[1.6]">{{ message.body }}</p>

              <a
                v-if="message.attachment"
                :href="attachmentUrl(message.attachmentId)"
                target="_blank"
                rel="noopener"
                class="mt-2 flex min-h-11 items-center gap-2 font-mono text-[11.5px] text-ink-muted underline-offset-4 hover:underline"
              >
                <AppIcon name="file" :size="13" />
                {{ message.attachment }}
              </a>

              <p class="tabular mt-2 text-[11px] text-ink-faint">
                {{ message.from === 'you' ? 'You' : 'PF department' }} · {{ message.at }}
              </p>
            </div>
          </div>
        </div>

        <footer v-if="!selected.closed" class="border-t border-border px-6 py-4">
          <textarea
            v-model="reply"
            rows="2"
            placeholder="Write a reply…"
            class="w-full resize-none rounded-[10px] border border-border-strong bg-surface px-3.5 py-3 text-sm outline-none"
          />

          <p v-if="replyError" class="mt-2 text-[12.5px] text-danger-700">{{ replyError }}</p>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              class="flex min-h-11 items-center gap-2 text-[12.5px] font-medium text-ink-muted hover:text-ink"
              @click="chooseReplyFile"
            >
              <AppIcon name="upload" :size="15" />
              <span>{{ replyFile ? replyFile.name : 'Attach a file' }}</span>
            </button>
            <input
              ref="replyFileInput"
              type="file"
              class="hidden"
              accept="application/pdf,image/jpeg,image/png"
              @change="replyFileChosen"
            />

            <div class="flex items-center gap-3">
              <button
                :disabled="busy"
                class="min-h-11 rounded-[10px] border border-border-strong px-4 text-[13px] font-medium transition-colors hover:bg-surface-sub disabled:opacity-60"
                @click="settle"
              >
                This is settled, close it
              </button>
              <button
                :disabled="busy"
                class="min-h-11 rounded-[10px] bg-brand-500 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
                @click="send"
              >
                {{ busy ? 'Sending…' : 'Reply' }}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>

    <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
  </div>
</template>
