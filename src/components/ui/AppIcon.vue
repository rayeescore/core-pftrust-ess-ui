<script setup>
import { computed } from 'vue'

/**
 * The icon set, transcribed from the design canvas rather than pulled from a library.
 *
 * A stroke set at 1.6 on an 18-unit grid, which is what the artboards draw. Inlining them keeps the
 * portal to one network request for its whole icon vocabulary and lets every glyph inherit currentColor
 * — the left rail's active item and the quick-action rows both rely on that.
 *
 * `home` is deliberately both the logo mark and the Dashboard item: the mark IS the dashboard, and the
 * canvas draws them identically.
 */
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 17 },
})

const paths = {
  home: ['M3 14.4V6.6L9 3l6 3.6v7.8', 'M7 14.4v-4.2h4v4.2'],
  passbook: ['M2.4 4.2h13.2a2.2 2.2 0 0 1 2.2 2.2', 'M2.4 7.6h13.2M6 11.4h3'],
  profile: ['M3.6 15c0-2.7 2.4-4.4 5.4-4.4s5.4 1.7 5.4 4.4'],
  loan: ['M11 6.6a2.4 2.4 0 0 0-2-1c-1.2 0-2.1.7-2.1 1.6 0 2 4.2 1.2 4.2 3.2 0 .9-.9 1.6-2.1 1.6a2.4 2.4 0 0 1-2-1M9 4.4v9.2'],
  transferIn: ['M2.6 6.6h12.8M11.4 3l4 3.6-4 3.6M15.4 13.4H2.6'],
  claims: ['M3 8.4 9 3l6 5.4M4.6 8v6.4h8.8V8'],
  help: ['M3.4 4.2h11.2v8H8.2L5 15v-2.8H3.4z'],
  trust: ['M9 12.4v-2.8M9 6h.01'],
  globe: ['M1.7 8h12.6M8 1.7c1.7 2 2.6 4 2.6 6.3S9.7 12.3 8 14.3c-1.7-2-2.6-4-2.6-6.3S6.3 3.7 8 1.7z'],
  chevronDown: ['M4 6.5 8 10.5 12 6.5'],
  chevronRight: ['m6 3.5 4.5 4.5L6 12.5'],
  plus: ['M9 5.8v6.4M5.8 9h6.4'],
  download: ['M9 2.6v8.8M5.6 8 9 11.4 12.4 8M3 14.4h12'],
  edit: ['M11.6 3.4 14.6 6.4 6.6 14.4H3.6v-3z'],
  warning: ['M9 2.6 16.4 15.4H1.6z', 'M9 7.2v3.4M9 13h.01'],
  info: ['M9 8.4v4.2M9 5.6h.01'],
  clock: ['M8 4.8v3.6l2.4 1.4'],
  // Direction matters on these two: money arriving from another trust, and money leaving on an advance.
  arrowIn: ['M2.4 8h11.2M9.6 4l4 4-4 4'],
  arrowOut: ['M13.6 8H2.4M6.4 4l-4 4 4 4'],
  check: ['M13.2 4.8 6.6 11.4 3.2 8'],
  upload: ['M9 11.4V2.6M5.6 6 9 2.6 12.4 6M3 14.4h12'],
  file: ['M10.4 2.6H5a1.4 1.4 0 0 0-1.4 1.4v10a1.4 1.4 0 0 0 1.4 1.4h8a1.4 1.4 0 0 0 1.4-1.4V6.6z', 'M10.4 2.6v4h4'],
  lock: ['M5.2 8V6a3.8 3.8 0 0 1 7.6 0v2', 'M4.2 8h9.6v6.2H4.2z'],
  arrowLeftSmall: ['m10 3.5-4.5 4.5L10 12.5'],
  // Dismiss. Drawn to match `plus` rather than a rotated copy of it -- the two swap in the same
  // slot (Ask a question / Never mind), and a form can be abandoned from more than one place.
  x: ['M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6'],
}

/** Glyphs whose shape needs a circle the path syntax above cannot express. */
const circles = {
  profile: { cx: 9, cy: 6.4, r: 2.9 },
  loan: { cx: 9, cy: 9, r: 6.4 },
  trust: { cx: 9, cy: 9, r: 6.4 },
  info: { cx: 9, cy: 9, r: 7.2 },
  clock: { cx: 8, cy: 8, r: 6.4 },
  plus: { cx: 9, cy: 9, r: 6.4 },
  x: { cx: 9, cy: 9, r: 6.4 },
  globe: { cx: 8, cy: 8, r: 6.3 },
}

/** The two glyphs the canvas draws on a 16-unit grid rather than 18. */
const smallGrid = ['globe', 'chevronDown', 'chevronRight', 'clock', 'arrowIn', 'arrowOut', 'check', 'arrowLeftSmall']

const viewBox = computed(() => (smallGrid.includes(props.name) ? '0 0 16 16' : '0 0 18 18'))
const rect = computed(() => (props.name === 'passbook' ? { x: 2.4, y: 4.2, w: 13.2, h: 10.2, r: 2.2 } : null))
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="viewBox"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="shrink-0"
  >
    <rect v-if="rect" :x="rect.x" :y="rect.y" :width="rect.w" :height="rect.h" :rx="rect.r" />
    <circle v-if="circles[name]" v-bind="circles[name]" />
    <path v-for="(d, i) in paths[name] ?? []" :key="i" :d="d" />
  </svg>
</template>
