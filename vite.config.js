import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// A build in a mode with no .env.<mode> file still succeeds, and ships a portal whose Keycloak URL is
// the string "undefined". keycloak-js then redirects to the relative path undefined/protocol/..., nginx's
// history fallback serves index.html for it, the app redirects again one level deeper, and the member
// ends on a 414 Request-URI Too Large with nothing to say why. So a build without these fails here.
const REQUIRED = ['VITE_API_BASE_URL', 'VITE_KEYCLOAK_URL', 'VITE_KEYCLOAK_REALM', 'VITE_KEYCLOAK_CLIENT_ID']

// Tailwind 4 is a Vite plugin, not a PostCSS step, and there is no tailwind.config.js -- the design
// system lives in the @theme block in src/assets/theme.css. See CLAUDE.md.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const missing = REQUIRED.filter((key) => !env[key])
  if (command === 'build' && env.VITE_USE_FIXTURES !== 'true' && missing.length) {
    throw new Error(
      `Build mode "${mode}" has no ${missing.join(', ')}. ` +
        `Build with --mode mahindra / qa / coreintegra (Docker: --build-arg BUILD_MODE=...), ` +
        `or add .env.${mode}.`,
    )
  }

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // 5173 belongs to the admin UI, which is already in this API's CORS allow-list. ESS needs its own
      // origin there before it can call the API at all -- SecurityConfiguration.ALLOWED_ORIGINS.
      port: 6064,
    },
  }
})
