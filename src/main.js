import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initKeycloak } from './keycloak/keycloak'
import { load as loadBranding } from './branding/branding'
import './assets/theme.css'

/**
 * Started here rather than inside bootstrap() so it overlaps the Keycloak redirect round trip instead
 * of being added to it: the branding endpoint is public and there is nothing to wait for.
 *
 * It runs in every fixture mode, including 'true'. The branding document is not member data -- it is
 * the tenant's own appearance, served without a token -- so there is nothing to fake, and running it
 * means the screens can be looked at in their real colours with no sign-in at all.
 *
 * load() never rejects, so this cannot become an unhandled rejection if bootstrap() throws first.
 */
const brandingLoaded = loadBranding()

/**
 * Keycloak is initialised before the app mounts, so no screen ever renders for an unauthenticated
 * caller. With fixtures on there is no API and no realm to talk to, so sign-in is skipped -- that flag
 * is for looking at the screens, never for a deployment.
 */
async function bootstrap() {
  // Skipped only in full-fixture mode, which has no API and no realm to talk to. 'partial' signs in
  // for real -- the identity call behind the shell is live.
  if (import.meta.env.VITE_USE_FIXTURES !== 'true') {
    await initKeycloak()
  }

  // Before mount, so the tenant's colours are on :root for the first paint rather than replacing the
  // built-in ones a frame later.
  await brandingLoaded

  createApp(App).use(router).mount('#app')
}

bootstrap()
