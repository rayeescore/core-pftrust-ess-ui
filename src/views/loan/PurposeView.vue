<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as me from '@/api/me'
import { useLoanDraft } from '@/composables/useLoanDraft'
import LoanFlowLayout from '@/layouts/LoanFlowLayout.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/**
 * Step 1: what the advance is for.
 *
 * **Ineligible purposes stay on the list, with the reason.** Hiding them looks tidier and generates
 * queries — a member who took this advance last year and cannot see it at all concludes the portal is
 * broken, where "Used 1 of 1 · not available" answers the question before it is asked. The reasons are
 * already computed server-side; today `LoanTypeServiceImpl` throws them away as exception strings.
 */
const router = useRouter()
const draft = useLoanDraft()
const groups = ref(null)

onMounted(async () => {
  groups.value = await me.getLoanTypes()
})

// The whole purpose is kept, not its code: it carries `asks`, which is what the details step draws its
// form from. The group name used to be carried alongside it and used for exactly that, which is how a
// pension withdrawal came to be shown a property form -- see useLoanFields.
function choose(type) {
  if (!type.eligible) return
  draft.value.purpose = type
}

const allTypes = (list) => list.flatMap((group) => group.types)

const ineligibleCount = (list) => allTypes(list).filter((type) => !type.eligible).length
</script>

<template>
  <LoanFlowLayout
    :step="1"
    title="What is the advance for?"
    intro="Each purpose has its own rules — how long you must have been a member, how many times you may draw, and how much of your balance you can reach. We have already checked yours."
    :note="
      groups
        ? `Purposes you cannot take today stay on the list with the reason. ${ineligibleCount(groups)} of the ${allTypes(groups).length} are closed to you right now.`
        : ''
    "
    :can-continue="Boolean(draft.purpose)"
    @continue="router.push('/loans/apply/amount')"
  >
    <div v-if="groups" class="flex flex-col gap-[22px]">
      <section v-for="group in groups" :key="group.name" class="flex flex-col gap-[11px]">
        <h2 class="eyebrow">{{ group.name }}</h2>

        <div class="grid gap-[11px] sm:grid-cols-2">
          <button
            v-for="type in group.types"
            :key="type.code"
            type="button"
            :disabled="!type.eligible"
            @click="choose(type)"
            class="flex flex-col gap-[7px] rounded-xl px-4 py-3.5 text-left transition-colors"
            :class="[
              draft.purpose?.code === type.code
                ? 'border-2 border-brand-500 bg-brand-50 px-[15px] py-[13px]'
                : type.eligible
                  ? 'border border-border bg-surface hover:bg-surface-sub'
                  : 'cursor-not-allowed border bg-surface-sub',
              !type.eligible ? 'border-border-subtle' : '',
            ]"
          >
            <span class="flex items-start justify-between gap-2.5">
              <span class="text-sm leading-[1.35] font-semibold">{{ type.title }}</span>
              <span
                v-if="draft.purpose?.code === type.code"
                class="flex size-5 shrink-0 items-center justify-center rounded-full bg-action-fill text-on-brand"
              >
                <AppIcon name="check" :size="12" />
              </span>
            </span>

            <span
              class="text-xs leading-[1.45]"
              :class="draft.purpose?.code === type.code ? 'text-brand-700' : 'text-ink-muted'"
            >
              {{ type.eligible ? type.basis : type.reason }}
            </span>

            <span
              class="flex items-center gap-[7px] text-[11.5px]"
              :class="
                draft.purpose?.code === type.code
                  ? 'text-brand-600'
                  : type.eligible
                    ? 'text-ink-muted'
                    : 'text-ink-faint'
              "
            >
              <span
                v-if="!type.eligible"
                class="size-1.5 rounded-full"
                style="background: var(--color-border-strong)"
              />
              {{ type.usage }}
            </span>
          </button>
        </div>
      </section>
    </div>

    <div v-else class="h-96 animate-pulse rounded-card bg-surface-deep" />
  </LoanFlowLayout>
</template>
