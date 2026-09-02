import { ref } from 'vue'

/**
 * The half-filled advance application, held across the five steps.
 *
 * Module-scoped rather than per-component, because the whole point of a five-step flow is that step 5
 * can see what step 1 chose. It is deliberately NOT persisted anywhere: nothing exists server-side to
 * hold a draft, and writing one to localStorage would put a member's financial details on a shared
 * machine with no way to clear them.
 *
 * That is also what the session-expiry modal promises to preserve — see App.vue. Today the modal keeps
 * the draft because the page is never reloaded; a real re-auth that reloads would lose it, and closing
 * that gap needs a draft endpoint rather than more front-end state.
 *
 * `documents` is keyed by the document NAME the checklist returned, because that is what the create
 * call sends back: the member-facing document record carries no id, for the same reason the purpose is
 * a code rather than a UUID.
 */
function empty() {
  return {
    purpose: null,
    /** The group the purpose came from — "Housing" is what decides whether the property block is asked. */
    group: null,
    totalCost: '',
    requested: '',
    /** What the amount step worked out they will actually receive. Recomputed server-side on submit. */
    entitlement: null,
    contactNumber: '',
    emailId: '',
    /** Housing purposes only. Null otherwise, and the API tolerates that now. */
    property: null,
    /** Code 13 only, where the money goes to the lender rather than to the member. */
    repaymentBank: null,
    /** { [documentName]: { fileName, path } } — filled by the upload step. */
    documents: {},
    declared: false,
  }
}

const draft = ref(empty())

export function useLoanDraft() {
  return draft
}

export function resetLoanDraft() {
  draft.value = empty()
}
