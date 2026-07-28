import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PROJECTS_MODULE_ENABLED } from '@/config/features'
import AppLayout from '@/layouts/AppLayout.vue'
import LoginView from '../views/LoginView.vue'

const REDIRECT_KEY = 'quinlist_redirect'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true },
    },
    {
      path: '/join/:boardSlug/:token',
      name: 'join',
      component: () => import('../views/JoinView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'board/:boardId', name: 'board', component: () => import('../views/BoardView.vue') },
        { path: 'calendar', name: 'calendar', component: () => import('../views/CalendarView.vue') },
        { path: 'reports', name: 'reports', component: () => import('../views/ReportsView.vue') },
        { path: 'issues', name: 'issues', component: () => import('../views/IssuesView.vue') },
        { path: 'releases', name: 'releases', component: () => import('../views/ReleasesView.vue') },
        { path: 'team', name: 'team', component: () => import('../views/TeamView.vue') },
        { path: 'projects', name: 'projects', component: () => import('../views/ProjectsView.vue') },
        {
          path: 'projects/:projectId',
          name: 'project-detail',
          component: () => import('../views/ProjectDetailView.vue'),
        },
        { path: 'settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.isReady) {
    await auth.init()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    sessionStorage.setItem(REDIRECT_KEY, to.fullPath)
    return { name: 'login' }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    const redirect = sessionStorage.getItem(REDIRECT_KEY)
    if (redirect) {
      sessionStorage.removeItem(REDIRECT_KEY)
      return redirect
    }
    return { name: 'home' }
  }

  if (!PROJECTS_MODULE_ENABLED && (to.name === 'projects' || to.name === 'project-detail')) {
    return { name: 'home' }
  }
})

export { REDIRECT_KEY }
export default router
