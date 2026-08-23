import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

/**
 * Routes mirror the information architecture in the design brief. Note what is absent and always will
 * be: there is no route that takes an employee identifier. Every screen is scoped to the caller by the
 * API, not by a parameter this app could get wrong.
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    {
      path: '/pf',
      name: 'passbook',
      component: () => import('@/views/PassbookView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-built',
      component: () => import('@/views/NotBuiltView.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
