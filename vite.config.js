import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Tailwind 4 is a Vite plugin, not a PostCSS step, and there is no tailwind.config.js -- the design
// system lives in the @theme block in src/assets/theme.css. See CLAUDE.md.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // 5173 belongs to the admin UI, which is already in this API's CORS allow-list. ESS needs its own
    // origin there before it can call the API at all -- SecurityConfiguration.ALLOWED_ORIGINS.
    port: 6064,
  },
})
