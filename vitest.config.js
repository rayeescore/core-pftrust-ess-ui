import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.js'],
    /**
     * Pin the fixture flag rather than inheriting it.
     *
     * Vite loads .env.local into import.meta.env for tests too, so without this the API tests pass or
     * fail depending on which of the three VITE_USE_FIXTURES settings a developer happens to have on
     * disk -- `true` makes every call return a fixture and never touch the client the tests assert on.
     * These tests exist to check the live request is shaped right, so they always take the live branch.
     */
    env: { VITE_USE_FIXTURES: 'false' },
  },
})
