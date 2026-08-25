<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import ChangeDiffRow from '@/components/product/ChangeDiffRow.vue'

/**
 * Asking the PF department to correct something.
 *
 * This screen exists because **there is no way to edit any of it.** `EmployeeController` has no PUT,
 * PATCH or DELETE at all — employees are created by the SAP import and never updated through the API —
 * so "update my details" cannot be a direct edit. It has to be a change request: propose, review,
 * apply. That object does not exist yet either; it is item 9 of the remaining backend work.
 *
 * The nominee total is the one validation a member can fail, so it is computed live here. A request
 * that leaves a share unassigned is accepted — a member may genuinely want that — but it says so.
 */
const router = useRouter()

const mobile = ref('98812 47730')
const nominees = ref([
  { name: 'Rohan Deshmukh', relationship: 'Son', current: 50, proposed: 60 },
  { name: 'Aarti Deshmukh', relationship: 'Mother', current: 30, proposed: 40 },
])
const reason = ref('')

const total = computed(() => nominees.value.reduce((sum, n) => sum + Number(n.proposed || 0), 0))
</script>

<template>
  <div class="flex flex-col gap-5">
    <header class="flex flex-col gap-1.5">
      <h1 class="font-display text-[30px] leading-[1.15]">Ask for a correction</h1>
      <p class="max-w-[72ch] text-sm leading-relaxed text-ink-muted">
        Your details come from payroll and cannot be edited here. Tell us what is wrong and the PF
        department will check it and put it right.
      </p>
    </header>

    <div class="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div class="flex flex-col gap-5">
        <section class="flex flex-col gap-5 rounded-card border border-border bg-surface px-6 py-[22px]">
          <h2 class="eyebrow">What should change</h2>

          <ChangeDiffRow label="Mobile number" current="98220 41123" mono>
            <input v-model="mobile" class="tabular w-full bg-transparent outline-none" />
          </ChangeDiffRow>

          <div class="flex flex-col gap-3 border-t border-border pt-5">
            <div class="flex flex-wrap items-baseline justify-between gap-3">
              <p class="text-[13px] font-medium">Nominees</p>
              <p class="text-[12px]" :class="total === 100 ? 'text-success-700' : 'text-warning-700'">
                {{ total === 100 ? 'Fully assigned' : `${100 - total}% unassigned` }}
              </p>
            </div>

            <div
              v-for="nominee in nominees"
              :key="nominee.name"
              class="flex flex-wrap items-center justify-between gap-3"
            >
              <p class="text-[13.5px]">
                {{ nominee.name }}
                <span class="text-ink-faint">· {{ nominee.relationship }}</span>
              </p>
              <div class="flex items-center gap-3">
                <span class="tabular text-[13px] text-ink-faint line-through">
                  {{ nominee.current }}%
                </span>
                <div
                  class="flex min-h-[46px] w-24 items-center rounded-[10px] border border-brand-500 bg-surface px-3"
                >
                  <input
                    v-model.number="nominee.proposed"
                    inputmode="numeric"
                    class="tabular w-full bg-transparent text-right outline-none"
                  />
                  <span class="ml-1 text-ink-muted">%</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 border-t border-border pt-3">
              <button class="text-[12.5px] font-semibold text-brand-600">Add a nominee</button>
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
          </div>

          <div class="border-t border-border pt-5">
            <label class="mb-[7px] block text-[13px] font-medium">
              Anything the PF department should know
            </label>
            <textarea
              v-model="reason"
              rows="3"
              placeholder="Optional — for example, why the number changed."
              class="w-full resize-none rounded-[10px] border border-border-strong bg-surface px-3.5 py-3 text-sm outline-none"
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
              class="min-h-11 rounded-[10px] border border-border-strong px-6 text-[15px] font-medium transition-colors hover:bg-surface-sub"
              @click="router.push('/profile')"
            >
              Cancel
            </button>
            <button
              class="min-h-11 rounded-[10px] bg-brand-500 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Send the request
            </button>
          </div>
        </div>
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
  </div>
</template>
