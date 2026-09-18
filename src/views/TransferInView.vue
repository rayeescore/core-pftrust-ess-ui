<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import * as me from '@/api/me'
import { displayDate } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import StatusChip from '@/components/ui/StatusChip.vue'

/**
 * Bringing a previous employer's provident fund into this trust.
 *
 * The screen asks **only what a member can answer.** Reference number, Annexure K, posting date and the
 * amounts all arrive from the other fund months later, and they are drawn as a visibly separate zone
 * the member never fills. The other fund's address and the EPS number are optional: a member often
 * knows neither, and the PF department finds them before the letter goes.
 *
 * The honest part is the timeline: three to six months, and out of the trust's hands. Members do not
 * know this and it is the single commonest thing they chase.
 */
const router = useRouter()

const transferIns = ref(null)
const form = reactive({
  employerName: '',
  joinedOn: '',
  leftOn: '',
  previousPfNumber: '',
  previousEpsNumber: '',
  heldBy: '',
  fundAddress: { line1: '', line2: '', line3: '', line4: '', pincode: '' },
  contactNumber: '',
  email: '',
})
const proof = ref(null)
// The name the member chose. The upload answers with a generated one, which means nothing to them.
const proofName = ref('')
const uploading = ref(false)
const sending = ref(false)
const error = ref('')
const fileInput = ref(null)

// Local, not toISOString: in India the UTC date is yesterday until half past five in the morning.
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const laterByDepartment = [
  { label: 'Reference number', when: 'On dispatch' },
  { label: 'Annexure K', when: 'When they reply' },
  { label: 'Amounts transferred', when: 'From Annexure K' },
]

const timeline = [
  { t: 'You send this', b: 'Today. Nothing else is needed from you after it.' },
  { t: 'The trust writes to them', b: 'Once the PF department has checked your details, with a request letter.' },
  { t: 'They reply with Annexure K', b: 'This is the wait. Three to six months is normal and it is out of the trust’s hands.' },
  { t: 'Your account is credited', b: 'The amounts appear in your passbook as a transfer-in event.' },
]

onMounted(async () => {
  const [list, profile] = await Promise.all([
    me.getTransferIns().catch(() => []),
    me.getProfile().catch(() => null),
  ])
  transferIns.value = list
  if (profile) {
    form.contactNumber = profile.mobile ?? ''
    form.email = profile.email ?? ''
  }
})

const canSend = computed(
  () =>
    form.employerName.trim() &&
    form.joinedOn &&
    form.leftOn &&
    form.previousPfNumber.trim() &&
    form.heldBy &&
    form.contactNumber.trim() &&
    form.email.trim() &&
    !uploading.value &&
    !sending.value,
)

async function attach(event) {
  const file = event.target.files?.[0]
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    proof.value = await me.uploadDocument(file)
    proofName.value = file.name
  } catch (failure) {
    error.value = failure.response?.data?.message ?? 'That file could not be attached. Try again.'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

function orNull(value) {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? null : trimmed
}

function body() {
  const address = Object.fromEntries(Object.entries(form.fundAddress).map(([key, value]) => [key, orNull(value)]))
  return {
    employerName: form.employerName.trim(),
    joinedOn: form.joinedOn,
    leftOn: form.leftOn,
    previousPfNumber: form.previousPfNumber.trim(),
    previousEpsNumber: orNull(form.previousEpsNumber),
    heldBy: form.heldBy,
    fundAddress: Object.values(address).some((value) => value !== null) ? address : null,
    contactNumber: form.contactNumber.trim(),
    email: form.email.trim(),
    proof: proof.value,
  }
}

async function send() {
  error.value = ''
  sending.value = true
  try {
    const created = await me.createTransferIn(body())
    router.push(`/transfer-in/${created.id}`)
  } catch (failure) {
    error.value = failure.response?.data?.message ?? 'That did not go through. Try again in a moment.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-col gap-1.5">
      <h1 class="font-display text-[25px] leading-[1.15] sm:text-[30px]">Bring an old PF account here</h1>
      <p class="max-w-[76ch] text-sm leading-relaxed text-ink-muted">
        If a previous employer still holds provident fund in your name, the trust will write to them and
        have it moved into this account. It takes months, and almost none of it needs you.
      </p>
    </header>

    <div class="grid items-start gap-5 *:min-w-0 lg:grid-cols-[1.4fr_1fr]">
      <div class="flex flex-col gap-5">
        <section
          v-if="transferIns?.length"
          class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]"
        >
          <h2 class="eyebrow">Your requests</h2>
          <RouterLink
            v-for="item in transferIns"
            :key="item.id"
            :to="`/transfer-in/${item.id}`"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3.5 hover:bg-surface-sub"
          >
            <div>
              <p class="text-[13.5px] font-medium">{{ item.employer ?? 'Previous employer' }}</p>
              <p class="text-[11.5px] text-ink-faint">
                <span class="font-mono">{{ item.reference }}</span> · {{ displayDate(item.appliedOn) }}
              </p>
            </div>
            <StatusChip :label="item.status.label" :tone="item.status.tone" />
          </RouterLink>
        </section>

        <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">{{ transferIns?.length ? 'Bring another account here' : 'The employer who holds it' }}</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField label="Employer">
              <input v-model="form.employerName" maxlength="100" class="w-full bg-transparent outline-none" />
            </FormField>
            <FormField label="Their PF account was with">
              <select v-model="form.heldBy" class="w-full bg-transparent outline-none">
                <option value="" disabled>Choose one</option>
                <option value="TRUST">The employer’s own trust</option>
                <option value="RPFC">The regional PF office</option>
              </select>
            </FormField>
            <FormField label="Your PF number there" mono>
              <input v-model="form.previousPfNumber" maxlength="50" class="w-full bg-transparent outline-none" />
            </FormField>
            <FormField label="Your EPS number there" hint="Optional" mono>
              <input v-model="form.previousEpsNumber" maxlength="50" class="w-full bg-transparent outline-none" />
            </FormField>
            <FormField label="You joined them">
              <input v-model="form.joinedOn" type="date" :max="today" class="w-full bg-transparent outline-none" />
            </FormField>
            <FormField label="You left them">
              <input v-model="form.leftOn" type="date" :max="today" class="w-full bg-transparent outline-none" />
            </FormField>
          </div>
          <p class="text-[12.5px] leading-[1.55] text-ink-faint">
            Whether the money sits with the employer’s own trust or with the regional PF office decides
            which letter the trust sends. Your old payslip or PF slip will say. If you are unsure, choose
            either and the PF department will correct it.
          </p>
        </section>

        <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">Where to write to them</h2>
          <p class="text-[12.5px] leading-[1.55] text-ink-faint">
            Optional. If you do not know their fund’s address, leave it — the PF department will find it.
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField v-for="n in 4" :key="n" :label="`Address line ${n}`">
              <input v-model="form.fundAddress[`line${n}`]" maxlength="100" class="w-full bg-transparent outline-none" />
            </FormField>
            <FormField label="Pincode" mono>
              <input v-model="form.fundAddress.pincode" inputmode="numeric" maxlength="6" class="w-full bg-transparent outline-none" />
            </FormField>
          </div>
        </section>

        <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">How the PF department reaches you</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField label="Mobile" mono>
              <input v-model="form.contactNumber" inputmode="tel" maxlength="16" class="w-full bg-transparent outline-none" />
            </FormField>
            <FormField label="Email">
              <input v-model="form.email" type="email" class="w-full bg-transparent outline-none" />
            </FormField>
          </div>
          <p class="text-[12.5px] leading-[1.55] text-ink-faint">
            Used for this request only. To change what is on your record, ask from your profile.
          </p>
        </section>

        <section class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">Anything you already have</h2>
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3.5">
            <div>
              <p class="text-[13.5px] font-medium">{{ proof ? proofName : 'Old PF slip, payslip or Form 13' }}</p>
              <p class="text-[11.5px] text-ink-faint">Optional — it speeds up tracing the account</p>
            </div>
            <input ref="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" class="hidden" @change="attach" />
            <button
              class="flex min-h-11 items-center gap-2 rounded-lg border border-border-strong px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-surface-sub disabled:opacity-60"
              :disabled="uploading"
              @click="fileInput.click()"
            >
              <AppIcon name="upload" :size="14" />
              {{ uploading ? 'Uploading…' : proof ? 'Replace' : 'Upload' }}
            </button>
          </div>
        </section>

        <!--
          A visibly separate zone. These are the fields the PF department completes from the other
          trust's reply, and showing them greyed rather than hiding them is what explains the wait.
        -->
        <section class="rounded-card border border-dashed border-border bg-surface-sub px-6 py-5">
          <h2 class="eyebrow eyebrow-faint">The PF department fills these in later</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <div v-for="item in laterByDepartment" :key="item.label">
              <p class="text-[13px] text-ink-faint">{{ item.label }}</p>
              <p class="mt-0.5 text-[12px] text-ink-faintest italic">{{ item.when }}</p>
            </div>
          </div>
          <p class="mt-3 text-[12.5px] leading-[1.55] text-ink-faint">
            You are never asked for these. They arrive with the other trust’s reply and are the reason
            the wait is what it is.
          </p>
        </section>

        <div class="flex flex-wrap items-center justify-between gap-4">
          <p v-if="error" class="max-w-[52ch] text-[12.5px] leading-[1.55] text-danger-700" role="alert">{{ error }}</p>
          <p v-else class="max-w-[52ch] text-[12.5px] leading-[1.55] text-ink-faint">
            You can raise a transfer-in for each previous employer that still holds a balance.
          </p>
          <button
            class="min-h-11 rounded-[10px] bg-brand-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSend"
            @click="send"
          >
            {{ sending ? 'Sending…' : 'Send the request' }}
          </button>
        </div>
      </div>

      <aside class="flex flex-col gap-4">
        <section class="rounded-card border border-border bg-surface px-5 py-5">
          <h2 class="eyebrow">What happens next</h2>
          <ol class="mt-3 flex flex-col">
            <li v-for="(step, index) in timeline" :key="step.t" class="flex gap-3">
              <div class="flex flex-col items-center">
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-deep text-[11px] font-semibold text-ink-muted"
                  >{{ index + 1 }}</span
                >
                <span
                  v-if="index < timeline.length - 1"
                  class="w-px flex-1 bg-border"
                  style="min-height: 20px"
                />
              </div>
              <div class="pb-4">
                <p class="text-[13.5px] font-medium">{{ step.t }}</p>
                <p class="mt-0.5 text-xs leading-[1.5] text-ink-muted">{{ step.b }}</p>
              </div>
            </li>
          </ol>
        </section>

        <section class="rounded-card border border-info-200 bg-info-50 px-4 py-4">
          <p class="text-[13px] leading-[1.55]" style="color: oklch(0.45 0.06 250)">
            <span class="font-semibold" style="color: oklch(0.37 0.085 250)">
              Transferring is usually better than withdrawing.
            </span>
            Money moved between funds keeps earning interest and is not taxed. Taking it out ends both.
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>
