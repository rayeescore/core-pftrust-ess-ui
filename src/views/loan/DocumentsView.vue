<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as me from '@/api/me'
import { useLoanDraft } from '@/composables/useLoanDraft'
import LoanFlowLayout from '@/layouts/LoanFlowLayout.vue'
import DocumentChecklistRow from '@/components/product/DocumentChecklistRow.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * Step 4: the proof.
 *
 * A named checklist, one row per document, because the required set is decided by the purpose and is
 * data rather than code — the PF department can change it without a release.
 *
 * **The list is empty for eleven of the twelve purposes today.** `loan_document_mapping` is seeded in
 * V0_0_30 with three rows, all for loan type 01, and no other migration touches it. The documents
 * themselves are seeded; they are simply unmapped. In the admin portal that is invisible because a
 * clerk knows what to collect. Here it becomes a member told they need no paperwork for a marriage
 * advance, and an application that stalls a fortnight later.
 */
const router = useRouter()
const draft = useLoanDraft()
const documents = ref(null)

onMounted(async () => {
  documents.value = await me.getLoanDocuments(draft.value.purpose?.code ?? '01')
})

const attached = computed(
  () => (documents.value ?? []).filter((doc) => doc.state === 'attached').length,
)
</script>

<template>
  <LoanFlowLayout
    :step="4"
    title="Attach your proof"
    :intro="
      documents?.length
        ? `The trust asks for ${documents.length} documents for this purpose. Each has its own slot, so nothing gets lost in a pile.`
        : 'We have no document list on file for this purpose. Check with the PF department before you submit.'
    "
    note="The required set is data, not code — it changes per purpose and the PF department can change it without a release."
    @back="router.push('/loans/apply/details')"
    @continue="router.push('/loans/apply/review')"
  >
    <div class="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="eyebrow">Required for this advance</h2>
          <p v-if="documents?.length" class="text-xs text-ink-faint">
            {{ attached }} of {{ documents.length }} attached
          </p>
        </div>

        <template v-if="documents?.length">
          <DocumentChecklistRow v-for="doc in documents" :key="doc.name" :document="doc" />
        </template>

        <!--
          The empty state that matters most on this screen. "No documents needed" would be a plausible
          reading of an empty list and is very likely wrong -- see the class comment.
        -->
        <div
          v-else-if="documents"
          class="rounded-xl border border-dashed border-border px-5 py-8 text-center"
        >
          <p class="text-sm font-semibold">No documents are mapped for this purpose</p>
          <p class="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">
            That is probably not the same as needing none. Please contact the PF department to confirm
            what to bring before you submit.
          </p>
        </div>

        <div v-else class="h-40 animate-pulse rounded-xl bg-surface-deep" />

        <button
          class="mt-1 flex items-center gap-2.5 rounded-xl border border-dashed border-border px-4 py-3.5 text-left transition-colors hover:bg-surface-sub"
        >
          <AppIcon name="plus" :size="18" class="text-brand-600" />
          <span>
            <span class="block text-[13.5px] font-medium">Add another document</span>
            <span class="block text-[11.5px] text-ink-faint">
              Anything else you think supports the application.
            </span>
          </span>
        </button>
      </section>

      <aside class="flex flex-col gap-4">
        <div class="rounded-card border border-border bg-surface px-5 py-5">
          <h2 class="eyebrow">Before you upload</h2>
          <p class="mt-2 text-[13px] leading-[1.55] text-ink-muted">
            Photographs of a document are fine as long as all four corners are in the frame and the text
            is readable. A scan the PF department cannot read comes back to you and costs a week.
          </p>
        </div>
      </aside>
    </div>
  </LoanFlowLayout>
</template>
