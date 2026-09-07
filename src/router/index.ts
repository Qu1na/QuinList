import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PROJECTS_MODULE_ENABLED } from '@/config/features'
import AppLayout from '@/layouts/AppLayout.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import LandingView from '../views/LandingView.vue'

const REDIRECT_KEY = 'quinlist_redirect'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
      meta: { guestLanding: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { publicShare: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guest: true },
    },
    {
      path: '/ayuda',
      name: 'help',
      component: () => import('../views/HelpView.vue'),
    },
    {
      path: '/privacidad',
      name: 'privacy',
      component: () => import('../views/PrivacyView.vue'),
    },
    {
      path: '/terminos',
      name: 'terms',
      component: () => import('../views/TermsView.vue'),
    },
    {
      path: '/share/project/:token',
      name: 'share-project',
      component: () => import('../views/SharedProjectView.vue'),
      meta: { publicShare: true },
    },
    {
      path: '/join/:boardSlug/:token',
      name: 'join',
      component: () => import('../views/JoinView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/join/project/:projectId/:token',
      name: 'join-project',
      component: () => import('../views/JoinProjectView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/app',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'board/:boardId', name: 'board', component: () => import('../views/BoardView.vue') },
        { path: 'calendar', name: 'calendar', component: () => import('../views/CalendarView.vue') },
        { path: 'events', name: 'events', component: () => import('../views/EventsView.vue') },
        { path: 'okrs', name: 'okrs', component: () => import('../views/OkrsView.vue') },
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
    // Redirecciones de rutas antiguas
    { path: '/board/:boardId', redirect: (to) => `/app/board/${to.params.boardId}` },
    { path: '/calendar', redirect: '/app/calendar' },
    { path: '/events', redirect: '/app/events' },
    { path: '/okrs', redirect: '/app/okrs' },
    { path: '/reports', redirect: '/app/reports' },
    { path: '/issues', redirect: '/app/issues' },
    { path: '/releases', redirect: '/app/releases' },
    { path: '/team', redirect: '/app/team' },
    { path: '/projects', redirect: '/app/projects' },
    { path: '/settings', redirect: '/app/settings' },
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

  if (to.meta.publicShare) {
    return true
  }

  if ((to.meta.guest || to.meta.guestLanding) && auth.isAuthenticated) {
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
