import { ref } from 'vue'

/**
 * The half-filled advance application, held across the five steps.
 *
 * Module-scoped rather than per-component, because the whole point of a five-step flow is that step 5
 * can see what step 1 chose. It is deliberately NOT persisted anywhere yet: nothing exists server-side
 * to hold a draft, and writing one to localStorage would put a member's financial details on a shared
 * machine with no way to clear them.
 *
 * That is also what the session-expiry modal promises to preserve — see App.vue. Today the modal keeps
 * the draft because the page is never reloaded; a real re-auth that reloads would lose it, and closing
 * that gap needs a draft endpoint rather than more front-end state.
 */
const draft = ref({
  purpose: null,
  totalCost: '4800000',
  requested: '3000000',
  documents: {},
  declared: false,
})

export function useLoanDraft() {
  return draft
}

export function resetLoanDraft() {
  draft.value = { purpose: null, totalCost: '', requested: '', documents: {}, declared: false }
}
