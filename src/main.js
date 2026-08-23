import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initKeycloak } from './keycloak/keycloak'
import './assets/theme.css'

/**
 * Keycloak is initialised before the app mounts, so no screen ever renders for an unauthenticated
 * caller. With fixtures on there is no API and no realm to talk to, so sign-in is skipped -- that flag
 * is for looking at the screens, never for a deployment.
 */
async function bootstrap() {
  if (import.meta.env.VITE_USE_FIXTURES !== 'true') {
    await initKeycloak()
  }

  createApp(App).use(router).mount('#app')
}

bootstrap()
