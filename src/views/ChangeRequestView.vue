<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import * as me from '@/api/me'
import AppIcon from '@/components/ui/AppIcon.vue'
import ChangeDiffRow from '@/components/product/ChangeDiffRow.vue'
import ProofPicker from '@/components/product/ProofPicker.vue'

/**
 * Asking the PF department to correct something.
 *
 * This screen exists because **there is no way to edit any of it directly.** Employees are created by
 * the SAP import, so "update my details" is a change request: propose, review, apply. The API holds the
 * request as a before-and-after diff, and this screen builds exactly that -- an item per field whose
 * proposed value differs from the one on record, and nothing else.
 *
 * Three rules are the server's and are mirrored here only so a member is not surprised by them: a
 * request that changes nothing is refused, a nominee or bank change has to come with proof, and the
 * nominee shares have to come to 100% (or nobody at all). The wording is the server's own, repeated so
 * the button says what the refusal would have said.
 *
 * **A request carries one file**, so a nominee change and a bank change go as two requests, each with
 * the document asked for under its own section. Contact changes need no proof and ride with the first.
 *
 * The list of correctable fields is closed on purpose and matches `ChangeRequestField` on the server.
 * Name, PERN, PF number and date of birth are identity, and are absent from both.
 */
const router = useRouter()

const CONTACT_FIELDS = [
  { field: 'MOBILE', label: 'Mobile number', key: 'mobile', mono: true },
  { field: 'ALTERNATE_MOBILE', label: 'Alternate mobile number', key: 'alternateMobile', mono: true },
  { field: 'EMAIL', label: 'Email address', key: 'email' },
  { field: 'ALTERNATE_EMAIL', label: 'Alternate email address', key: 'alternateEmail' },
]

const BANK_FIELDS = [
  { field: 'BANK_NAME', label: 'Bank name', key: 'name' },
  { field: 'BANK_BRANCH', label: 'Branch', key: 'branch' },
  { field: 'BANK_ACCOUNT_NUMBER', label: 'Account number', key: 'account', mono: true },
  { field: 'BANK_IFSC', label: 'IFSC code', key: 'ifsc', mono: true },
  { field: 'BANK_MICR', label: 'MICR code', key: 'micr', mono: true },
]

const NOMINATION_FORM = 'a signed nomination form'
const CANCELLED_CHEQUE = 'a cancelled cheque or a photograph of your passbook page'

const profile = ref(null)
const contact = ref({})
const bankOnRecord = ref({})
const bank = ref({ name: '', branch: '', account: '', ifsc: '', micr: '' })
const nominees = ref([])
const addingNominee = ref(false)
const newNominee = ref({ name: '', relationship: '', share: '' })
const note = ref('')
const nomineeProof = ref(null)
const bankProof = ref(null)
/** Parts of the form already sent, so a retry after a half-failed send does not raise them twice. */
const sent = ref(new Set())
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  const loaded = await me.getProfile()

  contact.value = Object.fromEntries(CONTACT_FIELDS.map(({ key }) => [key, loaded[key] ?? '']))
  bankOnRecord.value = bankFieldsOf(loaded.bank)
  nominees.value = (loaded.nominees ?? []).map((nominee) => ({
    name: nominee.name,
    relationship: nominee.relationship,
    current: nominee.share,
    proposed: nominee.share ?? '',
    removed: false,
    added: false,
  }))

  profile.value = loaded
})

/** The profile sends IFSC and MICR as one line ("HDFC0001 · MICR 400001"); the form wants them apart. */
function bankFieldsOf(onRecord) {
  if (!onRecord) return {}

  const codes = (onRecord.codes ?? '').split(' · ').filter(Boolean)

  return {
    name: onRecord.name ?? null,
    branch: onRecord.branch ?? null,
    account: onRecord.account ?? null,
    ifsc: codes.find((code) => !code.startsWith('MICR ')) ?? null,
    micr: codes.find((code) => code.startsWith('MICR '))?.slice(5) ?? null,
  }
}

const trimmed = (value) => (value == null ? '' : String(value).trim())

/**
 * Only what changed.
 *
 * A nominee's share is compared as a number, because the record sends 50 and the input holds "50".
 * Clearing a share box is not a removal -- removing is the explicit button, so a member who empties
 * a field while thinking does not silently drop their son from the nomination.
 */
const items = computed(() => {
  if (!profile.value) return []

  const out = []

  for (const { field, key } of CONTACT_FIELDS) {
    const current = trimmed(profile.value[key])
    const proposed = trimmed(contact.value[key])
    if (proposed !== current) {
      out.push({ field, currentValue: current || null, requestedValue: proposed || null })
    }
  }

  for (const nominee of nominees.value) {
    if (nominee.added) {
      out.push({
        field: 'NOMINEE',
        subject: nominee.relationship ? `${nominee.name} (${nominee.relationship})` : nominee.name,
        currentValue: null,
        requestedValue: trimmed(nominee.proposed),
      })
    } else if (nominee.removed) {
      out.push({
        field: 'NOMINEE',
        subject: nominee.name,
        currentValue: nominee.current == null ? null : String(nominee.current),
        requestedValue: null,
      })
    } else if (trimmed(nominee.proposed) && Number(nominee.proposed) !== Number(nominee.current)) {
      out.push({
        field: 'NOMINEE',
        subject: nominee.name,
        currentValue: nominee.current == null ? null : String(nominee.current),
        requestedValue: trimmed(nominee.proposed),
      })
    }
  }

  for (const { field, key } of BANK_FIELDS) {
    const proposed = trimmed(bank.value[key])
    const current = trimmed(bankOnRecord.value[key])
    if (proposed && proposed !== current) {
      out.push({ field, currentValue: current || null, requestedValue: proposed })
    }
  }

  return out
})

const touchesNominees = computed(() => items.value.some((item) => item.field === 'NOMINEE'))
const touchesBank = computed(() => items.value.some((item) => item.field.startsWith('BANK_')))
const standing = computed(() => nominees.value.filter((nominee) => !nominee.removed))

/** Rounded to the paise of a per cent, so 66.67 + 33.33 reads 100 and not 100.00000000000001. */
const total = computed(
  () =>
    Math.round(standing.value.reduce((sum, nominee) => sum + Number(nominee.proposed || 0), 0) * 100) /
    100,
)

/**
 * What will be sent, one request per document.
 *
 * Contact changes need no proof, so they join the first request rather than becoming a third. A part
 * already sent is left out, which is what makes pressing Send again after a half-failed send safe.
 */
const requests = computed(() => {
  const isNominee = (item) => item.field === 'NOMINEE'
  const isBank = (item) => item.field.startsWith('BANK_')

  const out = []

  if (!sent.value.has('nominees')) {
    const part = items.value.filter(isNominee)
    if (part.length) out.push({ parts: ['nominees'], what: 'nominee change', items: part, file: nomineeProof.value })
  }

  if (!sent.value.has('bank')) {
    const part = items.value.filter(isBank)
    if (part.length) out.push({ parts: ['bank'], what: 'bank account change', items: part, file: bankProof.value })
  }

  if (!sent.value.has('contact')) {
    const part = items.value.filter((item) => !isNominee(item) && !isBank(item))
    if (part.length && out.length) {
      out[0] = { ...out[0], parts: [...out[0].parts, 'contact'], items: [...part, ...out[0].items] }
    } else if (part.length) {
      out.push({ parts: ['contact'], what: 'contact change', items: part, file: null })
    }
  }

  return out
})

const whyNotYet = computed(() => {
  if (!requests.value.length) return 'Nothing has changed yet.'

  const nomineesPending = touchesNominees.value && !sent.value.has('nominees')

  if (nomineesPending && standing.value.length && total.value !== 100) {
    return `Your nominee shares come to ${total.value}%. Between them they need to come to exactly 100%.`
  }
  if (nomineesPending && !nomineeProof.value) return `Attach ${NOMINATION_FORM} under Nominees.`
  if (touchesBank.value && !sent.value.has('bank') && !bankProof.value) {
    return `Attach ${CANCELLED_CHEQUE} under the bank account.`
  }
  return ''
})

const canSend = computed(() => !busy.value && !whyNotYet.value)

function addNominee() {
  const name = trimmed(newNominee.value.name)
  const relationship = trimmed(newNominee.value.relationship)
  const share = trimmed(newNominee.value.share)

  // All three. The relationship is not decoration: the trust's nominee record cannot be saved without
  // one, and the API refuses an addition that lacks it rather than letting approval fail.
  if (!name || !relationship || !share) {
    error.value = 'A nominee needs a name, a relationship and a share.'
    return
  }

  if (nominees.value.some((nominee) => nominee.name.toLowerCase() === name.toLowerCase())) {
    error.value = `${name} is already a nominee -- change their share instead.`
    return
  }

  nominees.value.push({
    name,
    relationship,
    current: null,
    proposed: share,
    removed: false,
    added: true,
  })

  newNominee.value = { name: '', relationship: '', share: '' }
  addingNominee.value = false
  error.value = ''
}

/** A nominee added on this screen simply goes; one on record is marked, and the mark can be undone. */
function dropNominee(nominee) {
  if (nominee.added) {
    nominees.value = nominees.value.filter((each) => each !== nominee)
  } else {
    nominee.removed = !nominee.removed
  }
}

async function send() {
  if (!canSend.value) return

  busy.value = true
  error.value = ''

  const sentNow = []

  try {
    // One at a time, so a refusal stops the rest and says exactly which part went.
    for (const request of requests.value) {
      await me.createChangeRequest({ note: trimmed(note.value) || null, items: request.items }, request.file)
      sent.value = new Set([...sent.value, ...request.parts])
      sentNow.push(request.what)
    }
    router.push('/profile')
  } catch (failure) {
    // The API's refusals are written to be read by the member -- a 400 carries its message intact --
    // so it is shown as sent rather than replaced with a generic sentence.
    const reason = failure.response?.data?.message ?? 'That did not go through. Try again in a moment.'
    error.value = sentNow.length ? `Your ${sentNow.join(' and ')} was sent. The rest was not: ${reason}` : reason
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-wrap items-start justify-between gap-x-7 gap-y-2">
      <div class="flex flex-col gap-1.5">
        <h1 class="font-display text-[25px] leading-[1.15] sm:text-[30px]">Ask for a correction</h1>
        <p class="max-w-[72ch] text-sm leading-relaxed text-ink-muted">
          Your details come from payroll and cannot be edited here. Tell us what is wrong and the PF
          department will check it and put it right.
        </p>
      </div>

      <RouterLink
        to="/profile/corrections/history"
        class="inline-flex min-h-11 shrink-0 items-center text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
      >
        What you have already asked for
      </RouterLink>
    </header>

    <div v-if="profile" class="grid items-start gap-5 *:min-w-0 lg:grid-cols-[1.4fr_1fr]">
      <div class="flex flex-col gap-5">
        <section class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">How to reach you</h2>

          <ChangeDiffRow
            v-for="each in CONTACT_FIELDS"
            :key="each.field"
            :label="each.label"
            :current="profile[each.key] ?? null"
            :mono="each.mono"
          >
            <input
              v-model="contact[each.key]"
              :disabled="sent.has('contact')"
              :inputmode="each.mono ? 'tel' : 'email'"
              class="w-full bg-transparent outline-none"
              :class="each.mono ? 'tabular' : ''"
            />
          </ChangeDiffRow>

          <fieldset :disabled="sent.has('nominees')" class="flex min-w-0 flex-col gap-3 border-t border-border pt-5">
            <div class="flex flex-wrap items-baseline justify-between gap-3">
              <p class="text-[13px] font-medium">Nominees</p>
              <p class="text-[12px]" :class="total === 100 ? 'text-success-700' : 'text-warning-700'">
                {{
                  total === 100
                    ? 'Fully assigned'
                    : total > 100
                      ? `${Math.round((total - 100) * 100) / 100}% over`
                      : `${Math.round((100 - total) * 100) / 100}% unassigned`
                }}
              </p>
            </div>

            <div
              v-for="nominee in nominees"
              :key="nominee.name"
              class="flex flex-wrap items-center justify-between gap-3"
              :class="nominee.removed ? 'opacity-60' : ''"
            >
              <p class="text-[13.5px]" :class="nominee.removed ? 'line-through' : ''">
                {{ nominee.name }}
                <span v-if="nominee.relationship" class="text-ink-faint">· {{ nominee.relationship }}</span>
                <span v-if="nominee.added" class="ml-2 text-[11.5px] font-medium text-brand-600">New</span>
              </p>
              <div class="flex items-center gap-3">
                <span v-if="!nominee.added" class="tabular text-[13px] text-ink-faint line-through">
                  {{ nominee.current ?? '—' }}%
                </span>
                <div
                  v-if="!nominee.removed"
                  class="flex min-h-[46px] w-24 items-center rounded-[10px] border border-brand-500 bg-surface px-3 [&>input]:min-h-11"
                >
                  <input
                    v-model="nominee.proposed"
                    inputmode="numeric"
                    class="tabular w-full bg-transparent text-right outline-none"
                  />
                  <span class="ml-1 text-ink-muted">%</span>
                </div>
                <button
                  type="button"
                  class="min-h-11 text-[12.5px] font-medium"
                  :class="nominee.removed ? 'text-brand-600' : 'text-ink-muted hover:text-danger-700'"
                  @click="dropNominee(nominee)"
                >
                  {{ nominee.removed ? 'Keep' : 'Remove' }}
                </button>
              </div>
            </div>

            <p v-if="!nominees.length" class="text-[13px] text-ink-faint italic">
              Nobody is named yet. If it is still unassigned when a claim is made, the share is decided
              by law rather than by you.
            </p>

            <div
              v-if="addingNominee"
              class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-sub px-4 py-3"
            >
              <label class="flex min-w-[10rem] flex-1 flex-col gap-1">
                <span class="text-[11.5px] text-ink-faint">Name</span>
                <input
                  v-model="newNominee.name"
                  class="min-h-11 rounded-[10px] border border-border-strong bg-surface px-3 text-base outline-none"
                />
              </label>
              <label class="flex min-w-[8rem] flex-1 flex-col gap-1">
                <span class="text-[11.5px] text-ink-faint">Relationship</span>
                <input
                  v-model="newNominee.relationship"
                  placeholder="Daughter, spouse, mother…"
                  class="min-h-11 rounded-[10px] border border-border-strong bg-surface px-3 text-base outline-none"
                />
              </label>
              <label class="flex w-24 flex-col gap-1">
                <span class="text-[11.5px] text-ink-faint">Share</span>
                <input
                  v-model="newNominee.share"
                  inputmode="numeric"
                  class="tabular min-h-11 rounded-[10px] border border-border-strong bg-surface px-3 text-right text-base outline-none"
                />
              </label>
              <button
                type="button"
                class="min-h-11 rounded-[10px] bg-action-fill px-4 text-[13px] font-semibold text-on-brand hover:bg-brand-600"
                @click="addNominee"
              >
                Add
              </button>
            </div>

            <div class="flex items-center justify-between gap-3 border-t border-border pt-3">
              <button
                type="button"
                class="min-h-11 text-[12.5px] font-semibold text-brand-600"
                @click="addingNominee = !addingNominee"
              >
                {{ addingNominee ? 'Never mind' : 'Add a nominee' }}
              </button>
              <p class="flex items-baseline gap-2">
                <span class="text-[13px] text-ink-muted">Total</span>
                <span
                  class="tabular text-sm font-semibold"
                  :class="total === 100 ? 'text-success-700' : 'text-warning-700'"
                >
                  {{ total }}%
                </span>
              </p>
            </div>

            <p v-if="sent.has('nominees')" class="text-[12.5px] text-success-700">
              Sent. It is on your profile while the PF department checks it.
            </p>
            <!-- One signed nomination form lists every nominee, so one document covers the lot. -->
            <ProofPicker v-else-if="touchesNominees" v-model="nomineeProof" :document="NOMINATION_FORM" />
          </fieldset>

          <fieldset :disabled="sent.has('bank')" class="flex min-w-0 flex-col gap-4 border-t border-border pt-5">
            <div class="flex flex-wrap items-baseline justify-between gap-3">
              <p class="text-[13px] font-medium">Where money is paid</p>
              <p class="text-[12px] text-ink-faint">Leave a field blank to keep it as it is.</p>
            </div>
            <ChangeDiffRow
              v-for="each in BANK_FIELDS"
              :key="each.field"
              :label="each.label"
              :current="bankOnRecord[each.key] ?? null"
              :mono="each.mono"
            >
              <input
                v-model="bank[each.key]"
                class="w-full bg-transparent outline-none placeholder:text-ink-faint"
                :class="each.mono ? 'tabular' : ''"
                placeholder="No change"
              />
            </ChangeDiffRow>

            <p v-if="sent.has('bank')" class="text-[12.5px] text-success-700">
              Sent. It is on your profile while the PF department checks it.
            </p>
            <ProofPicker v-else-if="touchesBank" v-model="bankProof" :document="CANCELLED_CHEQUE" />
          </fieldset>

          <div class="border-t border-border pt-5">
            <label class="mb-[7px] block text-[13px] font-medium">
              Anything the PF department should know
            </label>
            <textarea
              v-model="note"
              rows="3"
              placeholder="Optional — for example, why the number changed."
              class="w-full resize-none rounded-[10px] border border-border-strong bg-surface px-3.5 py-3 text-base outline-none"
            />
          </div>
        </section>

        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="max-w-[52ch] text-[12.5px] leading-[1.55] text-ink-faint">
            Nothing changes until the PF department approves it. You will see this request, and its
            outcome, on your profile.
          </p>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="min-h-11 rounded-[10px] border border-border-strong px-6 text-[15px] font-medium transition-colors hover:bg-surface-sub"
              @click="router.push('/profile')"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="!canSend"
              class="min-h-11 rounded-[10px] bg-action-fill px-6 text-[15px] font-semibold text-on-brand transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="send"
            >
              {{ busy ? 'Sending…' : 'Send the request' }}
            </button>
          </div>
        </div>

        <!-- Beside the button that would fail, never in a toast. -->
        <p v-if="error" class="text-right text-[12.5px] text-danger-700">{{ error }}</p>
        <p v-else-if="whyNotYet && requests.length" class="text-right text-[12.5px] text-ink-muted">
          {{ whyNotYet }}
        </p>
      </div>

      <aside class="flex flex-col gap-4">
        <section class="rounded-card border border-border bg-surface px-5 py-5">
          <h2 class="eyebrow">What happens to it</h2>
          <ol class="mt-3 flex flex-col gap-3">
            <li
              v-for="(step, index) in [
                { t: 'The PF department checks it', b: 'Against payroll, and against whatever proof the change needs.' },
                { t: 'They apply it, or come back to you', b: 'A rejected request always says why.' },
                { t: 'Your details update', b: 'Everything raised afterwards uses the new value.' },
              ]"
              :key="step.t"
              class="flex gap-3"
            >
              <span
                class="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-deep text-[11px] font-semibold text-ink-muted"
                >{{ index + 1 }}</span
              >
              <div>
                <p class="text-[13.5px] font-medium">{{ step.t }}</p>
                <p class="mt-0.5 text-xs leading-[1.5] text-ink-muted">{{ step.b }}</p>
              </div>
            </li>
          </ol>
        </section>

        <!-- Said plainly, because it is the one change a member will assume is instant. -->
        <section class="flex items-start gap-3 rounded-card border border-warning-200 bg-warning-50 px-4 py-4">
          <AppIcon name="lock" :size="17" class="mt-px text-warning-500" />
          <p class="text-[13px] leading-[1.55] text-warning-700">
            A bank account change is verified against a cancelled cheque before any money moves. Raise it
            well before you need a payment, not alongside one.
          </p>
        </section>
      </aside>
    </div>

    <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
  </div>
</template>
