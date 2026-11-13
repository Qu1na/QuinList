import type { RouteRecordRaw } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import { marketingPages } from '@/seo/marketing'

/**
 * Rutas públicas e indexables. Las usa el router del navegador y el prerender
 * (src/prerender/entry-server.ts), que genera un HTML estático por cada una.
 */
export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: LandingView,
    meta: { guestLanding: true, seoPublic: true },
  },
  ...marketingPages.map<RouteRecordRaw>((page) => ({
    path: page.path,
    name: `mkt:${page.path}`,
    component: () => import('@/views/marketing/MarketingPageView.vue'),
    meta: { marketingPath: page.path, seoPublic: true },
  })),
  {
    path: '/ayuda',
    name: 'help',
    meta: { seoPublic: true },
    component: () => import('@/views/HelpView.vue'),
  },
  {
    path: '/privacidad',
    name: 'privacy',
    meta: { seoPublic: true },
    component: () => import('@/views/PrivacyView.vue'),
  },
  {
    path: '/terminos',
    name: 'terms',
    meta: { seoPublic: true },
    component: () => import('@/views/TermsView.vue'),
  },
]

export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/views/NotFoundView.vue'),
}

/** Rutas que el prerender convierte en HTML estático. */
export const PRERENDER_PATHS = [
  '/',
  ...marketingPages.map((p) => p.path),
  '/ayuda',
  '/privacidad',
  '/terminos',
]
