<script setup>
/**
 * Label, control and hint — the shape every field on the advance flow uses.
 *
 * `readonly` renders the value as a bordered plate rather than an input. That is not a styling variant
 * but a statement: bank details come from the employee master, which is SAP-owned and has no update
 * endpoint of any kind, so they can be shown here and corrected only through a change request.
 */
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  prefix: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  mono: { type: Boolean, default: false },
})
</script>

<template>
  <div>
    <label class="mb-[7px] block text-[13px] font-medium">{{ label }}</label>
    <div
      class="flex min-h-[46px] items-center gap-1.5 rounded-[10px] border px-3.5 py-3 text-[15px]"
      :class="[
        readonly ? 'border-border bg-surface-sub text-ink-soft' : 'border-border-strong bg-surface',
        mono ? 'font-mono text-sm' : '',
      ]"
    >
      <span v-if="prefix" class="text-ink-muted">{{ prefix }}</span>
      <slot />
    </div>
    <p v-if="hint" class="mt-1.5 text-xs leading-[1.45] text-ink-faint">{{ hint }}</p>
  </div>
</template>
