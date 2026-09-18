<script setup>
/**
 * Label, control and hint — the shape every field on the advance flow uses.
 *
 * `readonly` renders the value as a bordered plate rather than an input. That is not a styling variant
 * but a statement: bank details come from the employee master, which is SAP-owned and has no update
 * endpoint of any kind, so they can be shown here and corrected only through a change request.
 *
 * The field box is 46px, but the control inside it used to be 23px: the padding belonged to the box, so
 * a thumb landing anywhere but on the text itself hit the `div` and focused nothing. The padding is the
 * control's now, which is what makes the whole plate tappable.
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
      class="flex min-h-[46px] items-center gap-1.5 rounded-[10px] border px-3.5 py-0 text-[15px] [&>input]:min-h-11 [&>select]:min-h-11"
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
