<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as me from '@/api/me'
import { useLoanDraft } from '@/composables/useLoanDraft'
import LoanFlowLayout from '@/layouts/LoanFlowLayout.vue'
import DocumentChecklistRow from '@/components/product/DocumentChecklistRow.vue'

/**
 * Step 4: the proof.
 *
 * A named checklist, one row per document, because the required set is decided by the purpose and is
 * data rather than code — the PF department can change it without a release. The name is also what the
 * create call sends back: the member-facing document record carries no id, for the same reason the
 * purpose is a code rather than a UUID.
 *
 * **The list is empty for eleven of the twelve purposes today.** `loan_document_mapping` is seeded in
 * V0_0_30 with three rows, all for loan type 01, and no other migration touches it. The documents
 * themselves are seeded; they are simply unmapped. In the admin portal that is invisible because a
 * clerk knows what to collect. Here it becomes a member told they need no paperwork for a marriage
 * advance, and an application that stalls a fortnight later — so the empty state says the trust has no
 * list on file, which is true, rather than that none is needed, which is probably false.
 *
 * The 5 MB limit is checked here as well as by the API. A member on a slow connection should be told
 * before the upload rather than after it.
 */
const MAX_BYTES = 5 * 1024 * 1024

const router = useRouter()
const draft = useLoanDraft()

const documents = ref(null)
const uploading = ref(null)
const failed = ref(null)

onMounted(async () => {
  documents.value = await me.getLoanDocuments(draft.value.purpose?.code ?? '01')
})

/** The checklist, with anything attached in this session shown as attached. */
const rows = computed(() =>
  (documents.value ?? []).map((doc) => {
    const attached = draft.value.documents[doc.name]
    return attached
      ? { ...doc, state: 'attached', detail: attached.fileName }
      : { ...doc, state: doc.state === 'attached' ? 'required' : doc.state }
  }),
)

const attached = computed(() => rows.value.filter((row) => row.state === 'attached').length)

async function upload(doc, file) {
  failed.value = null

  if (file.size > MAX_BYTES) {
    failed.value =
      'That file is larger than 5 MB. A photograph taken on a phone is usually well under it — try photographing the page rather than scanning it.'
    return
  }

  uploading.value = doc.name

  try {
    const stored = await me.uploadDocument(file)
    // Keyed by the document's name, which is what POST /me/loans references. Storing the returned path
    // rather than the File means step 5 submits without re-uploading anything.
    draft.value.documents[doc.name] = { fileName: stored.fileName, path: stored.path }
  } catch (error) {
    failed.value =
      error?.response?.data?.message ??
      'We could not upload that just now. Try again in a moment — nothing else you have entered is lost.'
  } finally {
    uploading.value = null
  }
}
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
    <div class="grid items-start gap-5 *:min-w-0 lg:grid-cols-[1.4fr_1fr]">
      <section class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="eyebrow">Required for this advance</h2>
          <p v-if="rows.length" class="text-xs text-ink-faint">
            {{ attached }} of {{ rows.length }} attached
          </p>
        </div>

        <!-- Beside what failed, not a toast: an upload error a member walks away from leaves them
             submitting an application with a document missing. -->
        <p
          v-if="failed"
          class="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] leading-relaxed"
        >
          {{ failed }}
        </p>

        <template v-if="rows.length">
          <DocumentChecklistRow
            v-for="doc in rows"
            :key="doc.name"
            :document="doc"
            :busy="uploading === doc.name"
            @upload="(file) => upload(doc, file)"
          />
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
      </section>

      <aside class="flex flex-col gap-4">
        <div class="rounded-card border border-border bg-surface px-5 py-5">
          <h2 class="eyebrow">Before you upload</h2>
          <p class="mt-2 text-[13px] leading-[1.55] text-ink-muted">
            Photographs of a document are fine as long as all four corners are in the frame and the text
            is readable. A scan the PF department cannot read comes back to you and costs a week.
          </p>
          <p class="mt-2 text-[13px] leading-[1.55] text-ink-muted">
            PDF, JPG or PNG, up to 5 MB each.
          </p>
        </div>
      </aside>
    </div>
  </LoanFlowLayout>
</template>
