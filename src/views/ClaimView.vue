<script setup>
import { ref } from 'vue'
import { money } from '@/composables/useFormat'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import DocumentChecklistRow from '@/components/product/DocumentChecklistRow.vue'

/**
 * Claiming the fund after leaving — and the screen this whole portal is shaped around.
 *
 * **It is reachable because the login outlives the job.** A settlement or transfer-out claim only
 * exists after somebody has left, so a portal whose accounts died on the last working day could never
 * carry one. The banner at the top says so explicitly, because a member who has left expects to be
 * locked out and needs telling they are not.
 *
 * It opens with the CHOICE, not a form, because it is the decision most members get wrong and the one
 * the trust can genuinely help with: moving the balance keeps the interest running and stays untaxed;
 * taking it out ends both. A portal that stays silent while somebody liquidates their retirement fund
 * is failing them, and the member's interest and the trust's are aligned here.
 *
 * **The worksheet is the payoff, and it does not exist yet.** `SettlementFinalDetails` — and so the net
 * credit amount — is only written once a clerk has keyed the settlement in, which means the one figure
 * a leaver needs in order to choose is produced *after* they have already chosen. Item 10c.
 */
const mode = ref('payout')

const worksheet = [
  { label: 'Balance on 01 Apr 2026', value: '2617990', sign: '' },
  { label: 'Contributions Apr–Aug', value: '123000', sign: '+ ' },
  { label: 'Transferred in', value: '184300', sign: '+ ' },
  { label: 'Medical advance taken', value: '120000', sign: '− ' },
  { label: 'Interest to 31 Aug', value: '89420', sign: '+ ' },
  { label: 'Before tax', value: '2894710', sign: '', subtotal: true },
  { label: 'Income tax deducted', value: '4180', sign: '− ' },
  { label: 'Education cess', value: '167', sign: '− ' },
]

const documents = [
  { name: 'Form 19', detail: 'form-19-signed.pdf · 480 KB', state: 'attached' },
  { name: 'Cancelled cheque', detail: 'PDF or JPG, up to 5 MB', state: 'required' },
  { name: 'PAN card', detail: 'PDF or JPG, up to 5 MB', state: 'required' },
]
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- The state the whole flow depends on. Without it a leaver assumes they have been locked out. -->
    <div class="rounded-xl border border-info-200 bg-info-50 px-[17px] py-3.5">
      <p class="text-[13.5px] leading-[1.6]" style="color: oklch(0.45 0.06 250)">
        <span class="font-semibold" style="color: oklch(0.37 0.085 250)">
          You left on 31 August 2026.
        </span>
        This account stays open until your fund is settled, so you can raise the claim, follow it, and
        download your statements. It closes once the money has been paid.
      </p>
    </div>

    <header class="flex flex-col gap-1.5">
      <h1 class="font-display text-[30px] leading-[1.15]">Claiming your provident fund</h1>
      <p class="max-w-[76ch] text-sm leading-relaxed text-ink-muted">
        You can take the money out, or move it to your next employer’s fund. Moving it keeps the
        interest running and stays untaxed.
      </p>
    </header>

    <!-- The choice, before any form. -->
    <div class="grid gap-4 sm:grid-cols-2">
      <button
        v-for="option in [
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
        ]"
        :key="option.key"
        class="flex flex-col gap-2 rounded-card px-5 py-5 text-left transition-colors"
        :class="
          mode === option.key
            ? 'border-2 border-brand-500 bg-brand-50 px-[19px] py-[19px]'
            : 'border border-border bg-surface hover:bg-surface-sub'
        "
        @click="mode = option.key"
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
            <FormField label="Reason"><input value="Resignation" class="w-full bg-transparent outline-none" /></FormField>
            <FormField label="Last working day">
              <input value="31 August 2026" class="w-full bg-transparent outline-none" />
            </FormField>
          </div>
          <p class="text-[12px] leading-[1.45] text-ink-faint">
            Retirement, resignation, termination and the rest each carry a different set of documents. A
            death claim is not raised here — a family member should contact the PF department directly.
          </p>
        </section>

        <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">Where to send the money</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField label="Account holder" readonly>Sunita Deshmukh</FormField>
            <FormField label="Bank" readonly>HDFC Bank · Nashik Road</FormField>
            <FormField label="Account number" readonly mono>••••••••4471</FormField>
            <FormField label="IFSC" readonly mono>HDFC0000521</FormField>
            <FormField
              label="PAN"
              readonly
              mono
              hint="Needed so tax is deducted at the right rate. Without it, more is withheld."
              >•••••2841F</FormField
            >
            <FormField label="Where to post the letter">
              <input value="Flat 302, Shreeji Residency …" class="w-full bg-transparent outline-none" />
            </FormField>
          </div>

          <p
            class="flex items-start gap-2.5 rounded-lg bg-warning-50 px-3.5 py-3 text-[12.5px] leading-[1.55] text-warning-700"
          >
            <AppIcon name="warning" :size="16" class="mt-px shrink-0 text-warning-500" />
            This is the last time these details matter, and there is no undoing a payment to the wrong
            account. Check the last four digits against your passbook before you submit.
          </p>
        </section>

        <section class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">Documents for a resignation</h2>
          <DocumentChecklistRow v-for="doc in documents" :key="doc.name" :document="doc" />
        </section>

        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="max-w-[52ch] text-[12.5px] leading-[1.55] text-ink-faint">
            Two people approve a settlement, as with an advance.
          </p>
          <button
            class="min-h-11 rounded-[10px] bg-brand-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Submit the claim
          </button>
        </div>
      </div>

      <aside class="flex flex-col gap-4">
        <!-- The worksheet: the one figure a leaver actually wants, with every line that produced it. -->
        <section class="overflow-hidden rounded-card border border-brand-100 bg-brand-50">
          <div class="px-5 pt-5 pb-4">
            <p class="text-[13px] font-medium" style="color: var(--color-brand-700)">
              You would receive
            </p>
            <p class="mt-1.5 flex items-baseline gap-[3px]">
              <span class="text-xl" style="color: var(--color-brand-600)">₹</span>
              <span
                class="tabular font-display text-[38px] leading-[1.1]"
                style="color: oklch(0.375 0.14 25)"
                >{{ money('2890363') }}</span
              >
            </p>
            <p class="mt-1.5 text-xs leading-[1.5]" style="color: var(--color-brand-700)">
              An estimate to 31 Aug 2026. The final figure is worked out on the day it is settled.
            </p>
          </div>

          <div class="border-t border-brand-100 bg-surface px-5 py-4">
            <h2 class="eyebrow">How that is reached</h2>
            <dl class="mt-1">
              <div
                v-for="row in worksheet"
                :key="row.label"
                class="flex items-baseline justify-between gap-4 py-2.5 text-[13.5px]"
                :class="row.subtotal ? 'border-t border-border font-semibold' : ''"
              >
                <dt :class="row.subtotal ? '' : 'text-ink-muted'">{{ row.label }}</dt>
                <dd class="tabular">{{ row.sign }}₹{{ money(row.value) }}</dd>
              </div>
              <div
                class="flex items-baseline justify-between gap-4 border-t border-border pt-2.5 text-[13.5px] font-semibold"
              >
                <dt>Paid to you</dt>
                <dd class="tabular">₹{{ money('2890363') }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <!-- The advice the trust is uniquely placed to give, and has no reason to withhold. -->
        <section class="rounded-card border border-warning-200 bg-warning-50 px-4 py-4">
          <h2 class="eyebrow" style="color: var(--color-warning-700)">Before you decide</h2>
          <p class="mt-2 text-[13px] leading-[1.55] text-warning-700">
            Taking the money out ends 14 years of compounding and costs tax that moving it would not. If
            you have another job lined up, moving the balance is almost always the better answer.
          </p>
        </section>

        <section class="rounded-card border border-border bg-surface-deep px-4 py-4">
          <h2 class="eyebrow">After you submit</h2>
          <p class="mt-2 text-[13px] leading-[1.55] text-ink-soft">
            You can follow it here, and you keep access until the money is paid — then this account
            closes for good.
            <span class="font-semibold text-ink">Download anything you want to keep before that.</span>
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>
