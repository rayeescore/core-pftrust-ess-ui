<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import * as me from '@/api/me'
import { displayDate } from '@/composables/useFormat'
import EmptyState from '@/components/ui/EmptyState.vue'
import { supportEmail, supportPhone } from '@/branding/branding'

/**
 * Who holds the member's money.
 *
 * The second dead link in the rail, and the one worth building carefully. A member's provident fund
 * sits with an exempted trust rather than with the regional PF office — which is why their statements
 * come from here and not from the EPFO portal, why their UAN shows no passbook there, and why the
 * money is not visible on the EPFO app. That single fact is the commonest thing members are confused
 * about, and it is the first thing this page says.
 *
 * Everything below the explanation is real data from GET /api/v1/me/trust. Nothing is hard-coded,
 * because a "Know your trust" page carrying invented trustees would be worse than no page at all.
 *
 * The trust and trustee tables are seeded by nobody, so a tenant that has not filled them in is a
 * genuine state rather than an error — hence the empty state rather than a row of blanks.
 */
const trust = ref(null)
const failed = ref(false)

onMounted(async () => {
  try {
    trust.value = await me.getTrust()
  } catch {
    failed.value = true
  }
})

/** Whether the trust has published anything at all about itself. */
const published = computed(
  () => Boolean(trust.value?.name || trust.value?.trustees?.length),
)

const details = computed(() => {
  if (!trust.value) return []

  return [
    { label: 'Registered name', value: trust.value.name },
    {
      label: 'Established',
      value: trust.value.incorporatedOn ? displayDate(trust.value.incorporatedOn) : null,
    },
    {
      label: 'Registered address',
      value: [trust.value.registeredAddress, trust.value.registeredPinCode]
        .filter(Boolean)
        .join(' — '),
    },
  ].filter((row) => row.value)
})

/**
 * The trust's own contact details when it has published them, and the tenant's PF-department strings
 * when it has not.
 *
 * The trust and trustee tables are seeded by nobody, so a tenant that has filled in tenant_configuration
 * and not `trust` is a real state -- and it is the state in which this block would otherwise show
 * nothing while the department's address sits one table away.
 */
const contactEmail = computed(() => trust.value?.email || supportEmail())
const contactPhone = computed(() => trust.value?.contact || supportPhone())

/** A tel: URI cannot carry spaces or punctuation; the displayed string keeps them. */
const telHref = computed(() =>
  contactPhone.value ? `tel:${contactPhone.value.replace(/[^+\d]/g, '')}` : null,
)
</script>

<template>
  <div class="flex flex-col gap-[22px]">
    <header class="flex flex-col gap-[7px]">
      <h1 class="font-display text-[25px] leading-[1.15] sm:text-[30px]">Know your trust</h1>
      <p class="max-w-[72ch] text-[13.5px] leading-relaxed text-ink-muted">
        Your provident fund is held by an exempted trust, not by the regional PF office. That is why
        your statements come from here rather than the EPFO portal, and why your balance does not
        appear on the EPFO app — the money is with the trust, and this is where you see it.
      </p>
    </header>

    <p
      v-if="failed"
      class="rounded-card border border-danger-200 bg-danger-50 px-6 py-5 text-sm leading-relaxed"
    >
      We could not load the trust's details just now. Refresh the page — nothing about your account is
      affected.
    </p>

    <div v-else-if="trust === null" class="flex flex-col gap-3">
      <div v-for="n in 2" :key="n" class="h-40 animate-pulse rounded-card bg-surface-deep" />
    </div>

    <EmptyState v-else-if="!published" title="The trust has not published its details here yet">
      Your fund is unaffected — this page is where the registered details and the current trustees will
      appear once the PF department publishes them.
      <template #action>
        <RouterLink to="/help" class="text-[13px] font-semibold text-brand-700 hover:text-brand-600">
          Ask the PF department →
        </RouterLink>
      </template>
    </EmptyState>

    <template v-else>
      <section
        v-if="details.length"
        class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]"
      >
        <h2 class="eyebrow">The trust</h2>
        <dl class="flex flex-col gap-2.5">
          <div
            v-for="row in details"
            :key="row.label"
            class="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0"
          >
            <dt class="text-[13px] text-ink-muted">{{ row.label }}</dt>
            <dd class="text-right text-[13.5px] font-medium">{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <section
        v-if="trust.trustees?.length"
        class="flex flex-col gap-3 rounded-card border border-border bg-surface px-6 py-[22px]"
      >
        <h2 class="eyebrow">Trustees</h2>
        <p class="max-w-[68ch] text-[13px] leading-relaxed text-ink-muted">
          The trustees are responsible for the fund. Half of them are appointed by the employer and
          half are elected by members like you.
        </p>
        <ul class="flex flex-col gap-2.5">
          <li
            v-for="trustee in trust.trustees"
            :key="trustee.name"
            class="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0"
          >
            <span class="text-[13.5px] font-medium">{{ trustee.name }}</span>
            <span v-if="trustee.since" class="text-[12.5px] text-ink-faint">
              Trustee since {{ displayDate(trustee.since) }}
            </span>
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-2 rounded-card border border-border bg-surface px-6 py-[22px]">
        <h2 class="eyebrow">Reaching the PF department</h2>
        <p class="max-w-[68ch] text-[13px] leading-relaxed text-ink-muted">
          Raise a query from
          <RouterLink to="/help" class="font-medium text-brand-700 hover:text-brand-600">
            Help &amp; queries </RouterLink
          >and it goes straight to the part of the department that handles it, with a record you can
          follow. That is faster than an email and it cannot get lost.
        </p>
        <dl v-if="trust.contactName || contactEmail || contactPhone" class="mt-1 flex flex-col gap-2">
          <div v-if="trust.contactName" class="flex flex-wrap justify-between gap-3">
            <dt class="text-[13px] text-ink-muted">Contact</dt>
            <dd class="text-[13.5px] font-medium">{{ trust.contactName }}</dd>
          </div>
          <div v-if="contactEmail" class="flex flex-wrap justify-between gap-3">
            <dt class="text-[13px] text-ink-muted">Email</dt>
            <dd class="text-[13.5px] font-medium">
              <a :href="`mailto:${contactEmail}`" class="text-brand-700 hover:text-brand-600">
                {{ contactEmail }}
              </a>
            </dd>
          </div>
          <div v-if="contactPhone" class="flex flex-wrap justify-between gap-3">
            <dt class="text-[13px] text-ink-muted">Telephone</dt>
            <dd class="font-mono text-[13.5px] font-medium">
              <a :href="telHref" class="text-brand-700 hover:text-brand-600">{{ contactPhone }}</a>
            </dd>
          </div>
        </dl>
      </section>
    </template>
  </div>
</template>
