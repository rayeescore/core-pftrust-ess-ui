<script setup>
import { onMounted, ref } from 'vue'
import * as me from '@/api/me'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusChip from '@/components/ui/StatusChip.vue'

/**
 * Questions to the PF department, as a two-sided conversation.
 *
 * A thread rather than a form, because the ticket module already stores it as one — subject, category,
 * priority, and comments marked OWNER or OTHER. Rendering that as a support form with a status field
 * would throw away the half of it that members actually use.
 *
 * **Only the member should be able to close their own question.** Today any holder of TICKET_CREATE can
 * close anyone's (SECURITY_AUDIT C1), so that has to be scoped to the owner before this ships — which
 * is what MemberOwnership is for.
 */
const tickets = ref(null)
const selected = ref(null)
const reply = ref('')

onMounted(async () => {
  tickets.value = await me.getTickets()
  selected.value = tickets.value[0]
})
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
        >
          <AppIcon name="plus" :size="17" />
          Ask a question
        </button>

        <button
          v-for="ticket in tickets"
          :key="ticket.reference"
          class="flex flex-col gap-1.5 rounded-xl border px-4 py-3.5 text-left transition-colors"
          :class="
            selected?.reference === ticket.reference
              ? 'border-brand-500 bg-brand-50'
              : 'border-border bg-surface hover:bg-surface-sub'
          "
          @click="selected = ticket"
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
              <p class="text-[13.5px] leading-[1.6]">{{ message.body }}</p>

              <p
                v-if="message.attachment"
                class="mt-2 flex items-center gap-2 font-mono text-[11.5px] text-ink-muted"
              >
                <AppIcon name="file" :size="13" />
                {{ message.attachment }}
              </p>

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
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button class="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted hover:text-ink">
              <AppIcon name="upload" :size="15" />
              Attach a file
            </button>
            <div class="flex items-center gap-3">
              <button
                class="min-h-10 rounded-[10px] border border-border-strong px-4 text-[13px] font-medium transition-colors hover:bg-surface-sub"
              >
                This is settled, close it
              </button>
              <button
                class="min-h-10 rounded-[10px] bg-brand-500 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Reply
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>

    <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
  </div>
</template>
