import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

/**
 * Routes mirror the information architecture in the design brief.
 *
 * Note what is absent and always will be: no route takes an identifier for a PERSON. `/loans/:id`
 * addresses an application, and the API checks that it is the caller's; there is no `/employee/:id`
 * anywhere, because every screen is scoped to the caller by the token rather than by a parameter this
 * app could get wrong.
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },

    { path: '/pf', name: 'passbook', component: () => import('@/views/PassbookView.vue') },
    { path: '/pf/statements', name: 'statements', component: () => import('@/views/StatementsView.vue') },

    { path: '/loans', name: 'loan-list', component: () => import('@/views/loan/LoanListView.vue') },

    // The five-step advance flow. Each step is a route so Back works, a half-filled application can be
    // linked to, and the Change links on Review go somewhere.
    { path: '/loans/apply', name: 'loan-purpose', component: () => import('@/views/loan/PurposeView.vue') },
    { path: '/loans/apply/amount', name: 'loan-amount', component: () => import('@/views/loan/AmountView.vue') },
    { path: '/loans/apply/details', name: 'loan-details', component: () => import('@/views/loan/DetailsView.vue') },
    { path: '/loans/apply/documents', name: 'loan-documents', component: () => import('@/views/loan/DocumentsView.vue') },
    { path: '/loans/apply/review', name: 'loan-review', component: () => import('@/views/loan/ReviewView.vue') },
    { path: '/loans/:id', name: 'loan-detail', component: () => import('@/views/loan/LoanDetailView.vue') },

    { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
    { path: '/profile/corrections', name: 'change-request', component: () => import('@/views/ChangeRequestView.vue') },
    { path: '/transfer-in', name: 'transfer-in', component: () => import('@/views/TransferInView.vue') },
    { path: '/transfer-in/:id', name: 'transfer-in-detail', component: () => import('@/views/TransferInDetailView.vue') },
    { path: '/claims', name: 'claims', component: () => import('@/views/ClaimView.vue') },
    { path: '/claims/:id', name: 'claim-detail', component: () => import('@/views/ClaimDetailView.vue') },
    { path: '/help', name: 'help', component: () => import('@/views/HelpView.vue') },
    { path: '/trust', name: 'trust', component: () => import('@/views/TrustView.vue') },

    { path: '/:pathMatch(.*)*', name: 'not-built', component: () => import('@/views/NotBuiltView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
