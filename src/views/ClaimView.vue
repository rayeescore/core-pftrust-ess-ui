<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import * as me from '@/api/me'
import { displayDate } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import DocumentChecklistRow from '@/components/product/DocumentChecklistRow.vue'

/**
 * Claiming the fund after leaving.
 *
 * **It is reachable because the login outlives the job.** A settlement or transfer-out claim only exists
 * after somebody has left, so a portal whose accounts died on the last working day could never carry one.
 * The banner at the top says so, because a member who has left expects to be locked out.
 *
 * It opens with the CHOICE, not a form: moving the balance keeps the interest running and stays untaxed,
 * taking it out ends both, and the trust has every reason to say so.
 *
 * **There is no estimate** (decided 2026-09-15). Interest runs to the settlement date, which the PF
 * department sets when it accepts the claim, so any figure shown before then would rest on a date nobody
 * has set. The amount appears on the claim's own page once it has been worked out. The bank account and
 * PAN are shown, not asked for: they come from the record, so a payout cannot be sent anywhere else.
 */
const router = useRouter()
const MAX_BYTES = 5 * 1024 * 1024

const claims = ref(null)
const types = ref([])
const profile = ref(null)
const mode = ref('payout')
const typeCode = ref('')
const attached = reactive({})
const uploading = ref(null)
const sending = ref(false)
const error = ref('')

const blankAddress = () => ({ line1: '', line2: '', line3: '', line4: '' })

const form = reactive({
  lastWorkingDay: '',
  contactNumber: '',
  email: '',
  address: blankAddress(),
  fund: { name: '', address: blankAddress() },
  newEmployerName: '',
  newEmployerAddress: blankAddress(),
  pfNumber: '',
  epsNumber: '',
  uanNumber: '',
})

onMounted(async () => {
  const [list, typeList, loaded] = await Promise.all([
    me.getClaims().catch(() => []),
    me.getClaimTypes().catch(() => []),
    me.getProfile().catch(() => null),
  ])
  claims.value = list
  types.value = typeList
  profile.value = loaded
  if (loaded) {
    form.contactNumber = loaded.mobile ?? ''
    form.email = loaded.email ?? ''
  }
})

const FINISHED = ['Rejected', 'Paid', 'Transferred', 'Cancelled']
const openClaim = computed(() => (claims.value ?? []).find((claim) => !FINISHED.includes(claim.status.label)))
const transfer = computed(() => mode.value === 'transfer')
const typesForMode = computed(() =>
  types.value.filter((type) => type.kind === (transfer.value ? 'TRANSFER' : 'PAYOUT')),
)
const chosenType = computed(() => types.value.find((type) => type.code === typeCode.value))
const checklist = computed(() =>
  (chosenType.value?.documents ?? []).map((doc) =>
    attached[doc.name] ? { ...doc, state: 'attached', detail: attached[doc.name].fileName } : doc,
  ),
)

const choices = [
  {
    key: 'payout',
    title: 'Pay it out to me',
    body: 'The whole balance goes to your bank account. Tax is deducted where it is due, and the account closes.',
  },
  {
    key: 'transfer',
    title: 'Move it to my next fund',
    body: 'To your new employer’s trust, or to the regional PF office. No tax, and the interest keeps running.',
  },
]

function choose(next) {
  mode.value = next
  typeCode.value = ''
}

async function upload(doc, file) {
  error.value = ''
  if (file.size > MAX_BYTES) {
    error.value = 'That file is larger than 5 MB. A photograph taken on a phone is usually well under it.'
    return
  }
  uploading.value = doc.name
  try {
    const stored = await me.uploadDocument(file)
    attached[doc.name] = { fileName: file.name, path: stored.path }
  } catch (failure) {
    error.value = failure.response?.data?.message ?? 'We could not upload that just now. Try again in a moment.'
  } finally {
    uploading.value = null
  }
}

const orNull = (value) => {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? null : trimmed
}
const lines = (address) => Object.fromEntries(Object.entries(address).map(([key, value]) => [key, orNull(value)]))

function body() {
  const request = {
    typeCode: typeCode.value,
    lastWorkingDay: form.lastWorkingDay,
    contactNumber: form.contactNumber.trim(),
    email: form.email.trim(),
    // Only the attachments for the type now chosen: switching the reason keeps earlier uploads in memory.
    documents: (chosenType.value?.documents ?? [])
      .filter((doc) => attached[doc.name])
      .map((doc) => ({ name: doc.name, fileName: attached[doc.name].fileName, path: attached[doc.name].path })),
  }
  if (transfer.value) {
    request.transferOut = {
      fund: { name: orNull(form.fund.name), address: lines(form.fund.address) },
      newEmployerName: orNull(form.newEmployerName),
      newEmployerAddress: lines(form.newEmployerAddress),
      pfNumber: orNull(form.pfNumber),
      epsNumber: orNull(form.epsNumber),
      uanNumber: orNull(form.uanNumber),
    }
  } else {
    request.address = lines(form.address)
  }
  return request
}

const canSend = computed(
  () =>
    Boolean(typeCode.value) &&
    Boolean(form.lastWorkingDay) &&
    form.contactNumber.trim() !== '' &&
    form.email.trim() !== '' &&
    (transfer.value
      ? form.fund.name.trim() !== '' &&
        form.fund.address.line1.trim() !== '' &&
        form.newEmployerName.trim() !== '' &&
        form.pfNumber.trim() !== ''
      : form.address.line1.trim() !== '') &&
    !uploading.value &&
    !sending.value,
)

async function send() {
  error.value = ''
  sending.value = true
  try {
    const created = await me.createClaim(body())
    router.push(`/claims/${created.id}`)
  } catch (failure) {
    error.value = failure.response?.data?.message ?? 'That did not go through. Try again in a moment.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- The state the whole flow depends on. Without it a leaver assumes they have been locked out. -->
    <div class="rounded-xl border border-info-200 bg-info-50 px-[17px] py-3.5">
      <p class="text-[13.5px] leading-[1.6]" style="color: oklch(0.45 0.06 250)">
        <span class="font-semibold" style="color: oklch(0.37 0.085 250)">
          This account stays open until your fund is settled.
        </span>
        You can raise the claim, follow it, and download your statements. It closes once the money has been
        paid.
      </p>
    </div>

    <header class="flex flex-col gap-1.5">
      <h1 class="font-display text-[30px] leading-[1.15]">Claiming your provident fund</h1>
      <p class="max-w-[76ch] text-sm leading-relaxed text-ink-muted">
        You can take the money out, or move it to your next employer’s fund. Moving it keeps the interest
        running and stays untaxed.
      </p>
    </header>

    <section
      v-if="claims?.length"
      class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]"
    >
      <h2 class="eyebrow">Your claims</h2>
      <RouterLink
        v-for="claim in claims"
        :key="claim.id"
        :to="`/claims/${claim.id}`"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3.5 hover:bg-surface-sub"
      >
        <div>
          <p class="text-[13.5px] font-medium">{{ claim.title }}</p>
          <p class="text-[11.5px] text-ink-faint">
            <span class="font-mono">{{ claim.reference }}</span>
            <template v-if="claim.appliedOn"> · {{ displayDate(claim.appliedOn) }}</template>
          </p>
        </div>
        <StatusChip :label="claim.status.label" :tone="claim.status.tone" />
      </RouterLink>
    </section>

    <p v-if="openClaim" class="rounded-xl bg-surface-sub px-4 py-3.5 text-[13px] leading-[1.6] text-ink-soft">
      You have a claim open, so another cannot be raised until the PF department has finished with it.
      <RouterLink :to="`/claims/${openClaim.id}`" class="font-semibold text-brand-700">Follow it here.</RouterLink>
    </p>

    <template v-else-if="claims !== null">
      <div class="grid gap-4 sm:grid-cols-2">
        <button
          v-for="option in choices"
          :key="option.key"
          type="button"
          class="flex flex-col gap-2 rounded-card px-5 py-5 text-left transition-colors"
          :class="
            mode === option.key
              ? 'border-2 border-brand-500 bg-brand-50 px-[19px] py-[19px]'
              : 'border border-border bg-surface hover:bg-surface-sub'
          "
          :aria-pressed="mode === option.key"
          @click="choose(option.key)"
        >
          <span class="flex items-center justify-between gap-3">
            <span class="text-[15px] font-semibold">{{ option.title }}</span>
            <span
              v-if="mode === option.key"
              class="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white"
            >
              <AppIcon name="check" :size="12" />
            </span>
          </span>
          <span class="text-[13px] leading-[1.55] text-ink-muted">{{ option.body }}</span>
        </button>
      </div>

      <div class="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div class="flex flex-col gap-5">
          <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
            <h2 class="eyebrow">Why you left</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <FormField label="Reason">
                <select v-model="typeCode" class="w-full bg-transparent outline-none" aria-label="Reason">
                  <option value="" disabled>Choose one</option>
                  <option v-for="type in typesForMode" :key="type.code" :value="type.code">{{ type.title }}</option>
                </select>
              </FormField>
              <FormField label="Last working day">
                <input
                  v-model="form.lastWorkingDay"
                  type="date"
                  class="w-full bg-transparent outline-none"
                  aria-label="Last working day"
                />
              </FormField>
            </div>
            <p class="text-[12px] leading-[1.45] text-ink-faint">
              A death claim is not raised here — a family member should contact the PF department directly.
            </p>
          </section>

          <section v-if="!transfer" class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
            <h2 class="eyebrow">Where to send the money</h2>
            <template v-if="profile?.bank">
              <div class="grid gap-4 sm:grid-cols-2">
                <FormField label="Bank" readonly>{{ profile.bank.name }} · {{ profile.bank.branch }}</FormField>
                <FormField label="Account number" readonly mono>{{ profile.bank.account }}</FormField>
                <FormField label="PAN" readonly mono hint="Needed so tax is deducted at the right rate.">
                  {{ profile.pan ?? '—' }}
                </FormField>
              </div>
              <p
                class="flex items-start gap-2.5 rounded-lg bg-warning-50 px-3.5 py-3 text-[12.5px] leading-[1.55] text-warning-700"
              >
                <AppIcon name="warning" :size="16" class="mt-px shrink-0 text-warning-500" />
                <span>
                  The payment goes to this account and cannot be undone. If it is wrong,
                  <RouterLink to="/profile/corrections" class="font-semibold">ask for a correction</RouterLink>
                  before you claim.
                </span>
              </p>
            </template>
            <p v-else class="rounded-lg bg-warning-50 px-3.5 py-3 text-[12.5px] leading-[1.55] text-warning-700">
              There is no bank account on your record, so there is nowhere to pay this yet.
              <RouterLink to="/profile/corrections" class="font-semibold">Add it first</RouterLink>, then raise the
              claim.
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <FormField v-for="n in 4" :key="n" :label="`Your address, line ${n}`">
                <input
                  v-model="form.address[`line${n}`]"
                  maxlength="255"
                  class="w-full bg-transparent outline-none"
                  :aria-label="`Your address, line ${n}`"
                />
              </FormField>
            </div>
          </section>

          <section v-else class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
            <h2 class="eyebrow">Where the money goes</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <FormField label="The fund receiving it" hint="Your new employer’s HR or PF slip names it">
                <input
                  v-model="form.fund.name"
                  maxlength="255"
                  class="w-full bg-transparent outline-none"
                  aria-label="The fund receiving it"
                />
              </FormField>
              <FormField label="Your new employer">
                <input
                  v-model="form.newEmployerName"
                  maxlength="255"
                  class="w-full bg-transparent outline-none"
                  aria-label="Your new employer"
                />
              </FormField>
              <FormField v-for="n in 4" :key="`fund${n}`" :label="`That fund’s address, line ${n}`">
                <input
                  v-model="form.fund.address[`line${n}`]"
                  maxlength="255"
                  class="w-full bg-transparent outline-none"
                  :aria-label="`That fund’s address, line ${n}`"
                />
              </FormField>
              <FormField label="Your PF number there" mono>
                <input
                  v-model="form.pfNumber"
                  maxlength="255"
                  class="w-full bg-transparent outline-none"
                  aria-label="Your PF number there"
                />
              </FormField>
              <FormField label="EPS number there" hint="Optional" mono>
                <input
                  v-model="form.epsNumber"
                  maxlength="255"
                  class="w-full bg-transparent outline-none"
                  aria-label="EPS number there"
                />
              </FormField>
              <FormField label="UAN" hint="Optional" mono>
                <input v-model="form.uanNumber" maxlength="255" class="w-full bg-transparent outline-none" aria-label="UAN" />
              </FormField>
            </div>
          </section>

          <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
            <h2 class="eyebrow">How the PF department reaches you</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <FormField label="Mobile" mono>
                <input
                  v-model="form.contactNumber"
                  inputmode="tel"
                  maxlength="16"
                  class="w-full bg-transparent outline-none"
                  aria-label="Mobile"
                />
              </FormField>
              <FormField label="Email">
                <input v-model="form.email" type="email" class="w-full bg-transparent outline-none" aria-label="Email" />
              </FormField>
            </div>
          </section>

          <section v-if="chosenType" class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]">
            <h2 class="eyebrow">Documents for {{ chosenType.title.toLowerCase() }}</h2>
            <DocumentChecklistRow
              v-for="doc in checklist"
              :key="doc.name"
              :document="doc"
              :busy="uploading === doc.name"
              @upload="(file) => upload(doc, file)"
            />
          </section>

          <div class="flex flex-wrap items-center justify-between gap-4">
            <p v-if="error" class="max-w-[52ch] text-[12.5px] leading-[1.55] text-danger-700" role="alert">{{ error }}</p>
            <p v-else class="max-w-[52ch] text-[12.5px] leading-[1.55] text-ink-faint">
              The PF department fixes the settlement date and works out the amount when it accepts your claim.
            </p>
            <button
              type="button"
              class="min-h-11 rounded-[10px] bg-brand-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canSend"
              @click="send"
            >
              {{ sending ? 'Sending…' : 'Submit the claim' }}
            </button>
          </div>
        </div>

        <aside class="flex flex-col gap-4">
          <section class="rounded-card border border-warning-200 bg-warning-50 px-4 py-4">
            <h2 class="eyebrow" style="color: var(--color-warning-700)">Before you decide</h2>
            <p class="mt-2 text-[13px] leading-[1.55] text-warning-700">
              Taking the money out ends the compounding and costs tax that moving it would not. If you have
              another job lined up, moving the balance is almost always the better answer.
            </p>
          </section>
          <section class="rounded-card border border-border bg-surface-deep px-4 py-4">
            <h2 class="eyebrow">After you submit</h2>
            <p class="mt-2 text-[13px] leading-[1.55] text-ink-soft">
              You can follow it here, and you keep access until the money is paid — then this account closes
              for good. <span class="font-semibold text-ink">Download anything you want to keep before that.</span>
            </p>
          </section>
        </aside>
      </div>
    </template>

    <div v-else class="h-64 animate-pulse rounded-card bg-surface-deep" />
  </div>
</template>
