<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'

/**
 * Bringing a previous employer's provident fund into this trust.
 *
 * The screen asks **only what a member can answer.** Reference number, Annexure K, posting date and the
 * amounts all arrive from the other trust months later, and they are drawn as a visibly separate zone
 * the member never fills. Mixing them into the form would ask somebody for figures that do not exist
 * yet and make the wait look like their fault.
 *
 * The honest part is the timeline: three to six months, and out of the trust's hands. Members do not
 * know this and it is the single commonest thing they chase.
 */
const employer = [
  { label: 'Employer', value: 'Bharat Forge Ltd' },
  { label: 'Their PF account was with', value: 'Their own trust' },
  { label: 'Your PF number there', value: '883421', mono: true },
  { label: 'Your EPS number there', value: 'MH/44218/0009341', mono: true },
  { label: 'You joined them', value: '12 August 2004' },
  { label: 'You left them', value: '30 June 2007' },
]

const address = [
  { label: 'Address line 1', value: 'Mundhwa Industrial Area' },
  { label: 'Address line 2', value: 'Pune Cantonment' },
  { label: 'Address line 3', value: 'Pune' },
  { label: 'Address line 4', value: 'Maharashtra' },
  { label: 'Pincode', value: '411036', mono: true },
  { label: 'State', value: 'Maharashtra' },
]

const laterByDepartment = [
  { label: 'Reference number', when: 'On dispatch' },
  { label: 'Annexure K', when: 'When they reply' },
  { label: 'Amounts transferred', when: 'From Annexure K' },
]

const timeline = [
  { t: 'You send this', b: 'Today. Nothing else is needed from you after it.' },
  { t: 'The trust writes to them', b: 'Within a week or two, with a request letter and your details.' },
  { t: 'They reply with Annexure K', b: 'This is the wait. Three to six months is normal and it is out of the trust’s hands.' },
  { t: 'Your account is credited', b: 'The amounts appear in your passbook as a transfer-in event.' },
]
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-col gap-1.5">
      <h1 class="font-display text-[30px] leading-[1.15]">Bring an old PF account here</h1>
      <p class="max-w-[76ch] text-sm leading-relaxed text-ink-muted">
        If a previous employer still holds provident fund in your name, the trust will write to them and
        have it moved into this account. It takes months, and almost none of it needs you.
      </p>
    </header>

    <div class="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div class="flex flex-col gap-5">
        <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">The employer who holds it</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField v-for="f in employer" :key="f.label" :label="f.label" :mono="f.mono">
              <input :value="f.value" class="w-full bg-transparent outline-none" />
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
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField v-for="f in address" :key="f.label" :label="f.label" :mono="f.mono">
              <input :value="f.value" class="w-full bg-transparent outline-none" />
            </FormField>
          </div>
        </section>

        <section class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">Anything you already have</h2>
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3.5">
            <div>
              <p class="text-[13.5px] font-medium">Old PF slip, payslip or Form 13</p>
              <p class="text-[11.5px] text-ink-faint">Optional — it speeds up tracing the account</p>
            </div>
            <button
              class="flex min-h-9 items-center gap-2 rounded-lg border border-border-strong px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-surface-sub"
            >
              <AppIcon name="upload" :size="14" />
              Upload
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
          <p class="max-w-[52ch] text-[12.5px] leading-[1.55] text-ink-faint">
            You can raise a transfer-in for each previous employer that still holds a balance.
          </p>
          <button
            class="min-h-11 rounded-[10px] bg-brand-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Send the request
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
