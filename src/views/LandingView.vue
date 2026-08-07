<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderKanban,
  History,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  Menu,
  MessageSquare,
  Paperclip,
  Plus,
  Radio,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  Workflow,
  X,
  Zap,
} from '@lucide/vue'
import AppLogo from '@/components/brand/AppLogo.vue'
import LandingReviewsCarousel from '@/components/landing/LandingReviewsCarousel.vue'
import { usePageSeo } from '@/composables/usePageSeo'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
} from '@/seo/config'
import { landingSchemas } from '@/seo/schema'
import { getReviewsSummary, reviewsDataset } from '@/utils/reviews'

const year = computed(() => new Date().getFullYear())
const menuOpen = ref(false)
const scrolled = ref(false)
const openFaq = ref<number | null>(0)
let revealIo: IntersectionObserver | null = null

const ratingSummary = getReviewsSummary()
const reviews = reviewsDataset.reviews

const faqs = [
  {
    q: '¿Qué es QuinList?',
    a: 'QuinList es un software de gestión de proyectos y software colaborativo para empresas. Incluye gestor de tareas, tablero Kanban, workspaces, calendario, notificaciones y dashboard con métricas para la planificación y el seguimiento de proyectos.',
  },
  {
    q: '¿Reemplaza a herramientas de project management como Asana o Monday?',
    a: 'Sí: concentra gestión de proyectos, control de tareas, administración de equipos y colaboración en tiempo real en una sola plataforma SaaS, pensada para productividad empresarial.',
  },
  {
    q: '¿Puedo comenzar gratis?',
    a: 'Sí. Puedes crear cuenta y comenzar gratis sin tarjeta de crédito. Escala cuando tu equipo crezca y necesite más capacidad.',
  },
  {
    q: '¿Incluye roles, permisos e historial?',
    a: 'Sí. Tienes administración de usuarios, roles y permisos, historial de actividades y búsqueda rápida para gobernar el trabajo con seguridad.',
  },
  {
    q: '¿Sirve para equipos remotos o híbridos?',
    a: 'Totalmente. Es software SaaS con colaboración en tiempo real, notificaciones y acceso desde cualquier dispositivo para que el equipo avance alineado.',
  },
  {
    q: '¿Cómo solicito una demostración?',
    a: 'Escríbenos a contacto@matubyte.com o crea tu cuenta y explora la plataforma desde tu propio workspace. Te acompañamos si lo necesitas.',
  },
]

usePageSeo({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: '/',
  keywords: DEFAULT_KEYWORDS,
  jsonLd: landingSchemas(faqs),
})

function onScroll() {
  scrolled.value = window.scrollY > 12
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  const nodes = document.querySelectorAll('.landing-reveal')
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible')
          io.unobserve(e.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  )
  nodes.forEach((n) => io.observe(n))
  revealIo = io
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  revealIo?.disconnect()
})

function toggleFaq(i: number) {
  openFaq.value = openFaq.value === i ? null : i
}

function closeMenu() {
  menuOpen.value = false
}

const navLinks = [
  { href: '#beneficios', label: 'Beneficios' },
  { href: '#caracteristicas', label: 'Características' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#casos-de-uso', label: 'Casos de uso' },
  { href: '#opiniones', label: 'Reseñas' },
  { href: '#faq', label: 'FAQ' },
]

const benefits = [
  {
    icon: Zap,
    title: 'Más productividad empresarial',
    desc: 'Centraliza la planificación de proyectos y el control de tareas en un solo software colaborativo para que tu equipo avance sin fricción.',
  },
  {
    icon: Target,
    title: 'Visibilidad total del progreso',
    desc: 'Sigue el seguimiento de proyectos con métricas, prioridades y fechas límite claras desde el dashboard.',
  },
  {
    icon: Users,
    title: 'Administración de equipos',
    desc: 'Organiza por equipos y workspaces, asigna responsables y colabora en tiempo real sin cambiar de herramienta.',
  },
  {
    icon: Shield,
    title: 'Gobierno y control',
    desc: 'Roles, permisos, historial de actividades y administración de usuarios pensados para empresas.',
  },
]

const features = [
  { icon: FolderKanban, title: 'Gestión de proyectos', desc: 'Planifica, prioriza y entrega con un gestor de proyectos pensado para equipos.' },
  { icon: ClipboardList, title: 'Gestión de tareas', desc: 'Crea, asigna y cierra tareas con control total del flujo de trabajo.' },
  { icon: LayoutGrid, title: 'Tableros Kanban', desc: 'Visualiza el trabajo en columnas y arrastra tarjetas como en un tablero Kanban profesional.' },
  { icon: Users, title: 'Organización por equipos', desc: 'Estructura tu empresa por equipos y mantén a cada área alineada.' },
  { icon: Workflow, title: 'Espacios de trabajo', desc: 'Workspaces separados para clientes, áreas o unidades de negocio.' },
  { icon: Calendar, title: 'Calendario', desc: 'Vista de calendario para hitos, entregas y fechas límite.' },
  { icon: BarChart3, title: 'Seguimiento del progreso', desc: 'Mide avance real y detecta bloqueos a tiempo.' },
  { icon: CheckCircle2, title: 'Asignación de responsables', desc: 'Cada tarea con dueño claro y accountability.' },
  { icon: Clock, title: 'Fechas límite', desc: 'Deadlines visibles y recordatorios para no perder entregas.' },
  { icon: Sparkles, title: 'Prioridades', desc: 'Marca urgencia e impacto para enfocar al equipo.' },
  { icon: MessageSquare, title: 'Comentarios', desc: 'Contexto de la discusión junto a cada tarjeta.' },
  { icon: Paperclip, title: 'Archivos adjuntos', desc: 'Documentos y evidencias donde se necesita.' },
  { icon: Radio, title: 'Colaboración en tiempo real', desc: 'Cambios al instante para todo el equipo.' },
  { icon: Bell, title: 'Notificaciones', desc: 'Alertas de menciones, asignaciones y vencimientos.' },
  { icon: LayoutDashboard, title: 'Paneles con estadísticas', desc: 'Dashboard con métricas de productividad y carga.' },
  { icon: Shield, title: 'Roles y permisos', desc: 'Administración de usuarios con acceso granular.' },
  { icon: History, title: 'Historial de actividades', desc: 'Auditoría de cambios para seguimiento de proyectos.' },
  { icon: Search, title: 'Búsqueda rápida', desc: 'Encuentra tareas, proyectos y archivos en segundos.' },
]

const steps = [
  {
    step: '01',
    title: 'Crea tu workspace',
    desc: 'Regístrate en minutos y configura tu espacio de trabajo. Sin tarjeta de crédito.',
  },
  {
    step: '02',
    title: 'Invita a tu equipo',
    desc: 'Define roles y permisos, organiza por equipos y asigna responsables desde el primer día.',
  },
  {
    step: '03',
    title: 'Planifica y ejecuta',
    desc: 'Usa tableros Kanban, calendario y dashboard para el seguimiento de proyectos en tiempo real.',
  },
]

const useCases = [
  {
    title: 'Startups y product teams',
    desc: 'Roadmaps, sprints y releases con un software de gestión de proyectos ágil y visual.',
    tags: ['Kanban', 'Sprints', 'Métricas'],
  },
  {
    title: 'Agencias y consultoras',
    desc: 'Workspaces por cliente, control de tareas y colaboración en tiempo real con stakeholders.',
    tags: ['Workspaces', 'Archivos', 'Comentarios'],
  },
  {
    title: 'Operaciones y empresas',
    desc: 'Plataforma empresarial para administración de equipos, roles y productividad a escala.',
    tags: ['Roles', 'Dashboard', 'Auditoría'],
  },
]
</script>

<template>
  <div class="landing-page overflow-x-hidden bg-white text-[#2d2d2d]">
    <!-- Skip link accesibilidad -->
    <a href="#contenido-principal" class="landing-skip">Saltar al contenido</a>

    <!-- Nav -->
    <header
      class="landing-nav fixed inset-x-0 top-0 z-50 transition-all duration-300"
      :class="scrolled || menuOpen ? 'landing-nav--solid' : 'landing-nav--top'"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 lg:h-[68px] lg:gap-6 lg:px-8">
        <RouterLink
          to="/"
          class="flex shrink-0 items-center gap-2.5"
          aria-label="QuinList — inicio"
        >
          <AppLogo size="sm" eager />
          <span class="text-[15px] font-extrabold tracking-tight">QuinList</span>
        </RouterLink>

        <nav
          class="ml-2 hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Principal"
        >
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="landing-nav-link"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="ml-auto hidden items-center gap-1 sm:flex">
          <RouterLink to="/login" class="landing-nav-login">Iniciar sesión</RouterLink>
          <RouterLink to="/register" class="landing-nav-cta">Comenzar gratis</RouterLink>
        </div>

        <button
          type="button"
          class="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#2d2d2d] transition-colors hover:bg-black/5 sm:hidden"
          :aria-expanded="menuOpen"
          aria-controls="landing-mobile-menu"
          aria-label="Abrir menú"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="22" />
          <Menu v-else :size="22" />
        </button>
      </div>

      <div
        v-if="menuOpen"
        id="landing-mobile-menu"
        class="border-t border-[#eee] bg-white/95 px-5 py-4 backdrop-blur-md sm:hidden"
      >
        <nav class="flex flex-col" aria-label="Menú móvil">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="rounded-lg px-3 py-2.5 text-sm font-medium text-[#444] transition-colors hover:bg-[#fafafa] hover:text-[#2d2d2d]"
            @click="closeMenu"
          >
            {{ link.label }}
          </a>
        </nav>
        <div class="mt-4 flex flex-col gap-2 border-t border-[#f0f0f0] pt-4">
          <RouterLink
            to="/login"
            class="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-[#2d2d2d] ring-1 ring-[#e5e5e5] transition-colors hover:bg-[#fafafa]"
            @click="closeMenu"
          >
            Iniciar sesión
          </RouterLink>
          <RouterLink to="/register" class="landing-nav-cta justify-center" @click="closeMenu">
            Comenzar gratis
          </RouterLink>
        </div>
      </div>
    </header>

    <main id="contenido-principal">
      <!-- Hero -->
      <section class="landing-hero relative overflow-hidden pb-14 pt-[5.5rem] lg:pb-20 lg:pt-28" aria-labelledby="hero-heading">
        <div class="pointer-events-none absolute inset-0 landing-hero-bg" aria-hidden="true" />
        <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div class="landing-float-shape absolute top-28 right-[12%] h-14 w-14 rounded-2xl bg-[#f4845f]/25" />
          <div
            class="landing-float-shape absolute top-48 right-[28%] h-8 w-8 rounded-full bg-[#5bbce4]/35"
            style="animation-delay: 1.2s"
          />
          <div
            class="landing-float-shape absolute bottom-24 left-[8%] h-10 w-10 rotate-12 rounded-xl bg-[#f4845f]/20"
            style="animation-delay: 0.6s"
          />
        </div>

        <div class="relative mx-auto grid max-w-6xl items-center gap-8 px-5 lg:grid-cols-2 lg:gap-8 lg:px-8">
          <div class="z-10 max-w-xl landing-reveal">
            <h1 id="hero-heading" class="text-[2.35rem] leading-[1.08] font-extrabold tracking-tight sm:text-[2.85rem] lg:text-[3.35rem]">
              <span class="block text-[#2d2d2d]">QuinList</span>
              <span class="mt-1 block">
                <span class="text-[#f4845f]">Software de gestión de proyectos</span>
                <span class="text-[#2d2d2d]"> para equipos que entregan</span>
              </span>
            </h1>
            <p class="mt-5 max-w-lg text-[15px] leading-relaxed text-[#666] lg:text-base">
              QuinList es software de gestión de proyectos y project management software para
              empresas: gestión de tareas, tablero Kanban, workspace, calendario, roles y dashboard
              con métricas. Una plataforma de productividad SaaS para el seguimiento de proyectos y
              el trabajo colaborativo en un solo lugar.
            </p>
            <div class="mt-8 flex flex-wrap items-center gap-3">
              <RouterLink to="/register" class="landing-explore-btn gap-2">
                Comenzar gratis
                <ArrowRight :size="16" aria-hidden="true" />
              </RouterLink>
              <RouterLink to="/register" class="landing-enroll-btn">Crear cuenta</RouterLink>
            </div>
            <a
              href="#opiniones"
              class="mt-6 inline-flex items-center gap-3 rounded-full border border-[#eee] bg-white/90 px-4 py-2 shadow-sm transition-colors hover:border-[#f4845f]/40 hover:bg-[#fff8f5]"
              aria-label="Calificación 4.9 estrellas — ver reseñas de clientes"
            >
              <span class="flex items-center gap-0.5" aria-hidden="true">
                <Star
                  v-for="n in 5"
                  :key="n"
                  :size="14"
                  class="fill-[#f4845f] text-[#f4845f]"
                />
              </span>
              <span class="text-sm font-bold text-[#2d2d2d]">{{ ratingSummary.score }}</span>
              <span class="h-3 w-px bg-[#e5e5e5]" aria-hidden="true" />
              <span class="text-xs font-medium text-[#777]">
                {{ ratingSummary.label }} · {{ ratingSummary.displayCount }} reseñas
              </span>
            </a>
          </div>

          <!-- Product visual -->
          <div class="relative landing-reveal" style="transition-delay: 120ms">
            <div class="relative mx-auto w-full max-w-[520px]">
              <div
                class="landing-product-frame overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_25px_60px_-20px_rgba(45,45,45,0.35)]"
                role="img"
                aria-label="Vista previa de QuinList: sidebar, tablero Kanban y tarjetas de tareas"
              >
                <!-- App chrome -->
                <div class="flex items-center gap-2 border-b border-[#ececec] bg-[#f8f8f8] px-3 py-2.5">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span class="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span class="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <div class="ml-2 flex flex-1 items-center gap-2 rounded-md bg-white px-2.5 py-1 text-[10px] text-[#9ca3af] ring-1 ring-[#eee]">
                    <Search :size="11" aria-hidden="true" />
                    Buscar en el workspace…
                  </div>
                </div>

                <div class="flex min-h-[280px]">
                  <!-- Mini sidebar -->
                  <aside class="hidden w-[118px] shrink-0 border-r border-[#eee] bg-[#fafafa] p-2.5 sm:block" aria-hidden="true">
                    <div class="mb-3 flex items-center gap-1.5 px-1">
                      <span class="flex h-5 w-5 items-center justify-center rounded-md bg-[#f4845f] text-[9px] font-bold text-white">Q</span>
                      <span class="truncate text-[11px] font-bold text-[#2d2d2d]">QuinList</span>
                    </div>
                    <div class="space-y-1">
                      <div class="rounded-md bg-[#fff5f0] px-2 py-1.5 text-[10px] font-semibold text-[#f4845f]">Tableros</div>
                      <div class="px-2 py-1.5 text-[10px] text-[#888]">Proyectos</div>
                      <div class="px-2 py-1.5 text-[10px] text-[#888]">Calendario</div>
                      <div class="px-2 py-1.5 text-[10px] text-[#888]">Equipo</div>
                      <div class="px-2 py-1.5 text-[10px] text-[#888]">Reportes</div>
                    </div>
                    <div class="mt-4 border-t border-[#eee] pt-3">
                      <p class="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-wide text-[#bbb]">En línea</p>
                      <div class="flex -space-x-1.5 px-1">
                        <span class="h-5 w-5 rounded-full bg-[#f4845f] ring-2 ring-white" />
                        <span class="h-5 w-5 rounded-full bg-[#5bbce4] ring-2 ring-white" />
                        <span class="h-5 w-5 rounded-full bg-[#2d2d2d] ring-2 ring-white" />
                      </div>
                    </div>
                  </aside>

                  <!-- Board -->
                  <div class="min-w-0 flex-1 bg-white p-3">
                    <div class="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p class="text-[13px] font-bold text-[#2d2d2d]">Sprint 14 · Producto</p>
                        <p class="text-[10px] text-[#999]">12 tareas · 4 en curso</p>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="rounded-full bg-[#e8f6fc] px-2 py-0.5 text-[9px] font-semibold text-[#2d7eb8]">Kanban</span>
                        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
                          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                          Live
                        </span>
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                      <!-- Col: Por hacer -->
                      <div class="space-y-2">
                        <div class="flex items-center justify-between px-0.5">
                          <span class="text-[10px] font-bold uppercase tracking-wide text-[#999]">Por hacer</span>
                          <span class="text-[10px] font-semibold text-[#ccc]">3</span>
                        </div>
                        <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 shadow-sm">
                          <div class="mb-1.5 flex items-center gap-1">
                            <span class="h-1.5 w-1.5 rounded-full bg-[#f4845f]" />
                            <span class="text-[9px] font-semibold text-[#f4845f]">Alta</span>
                          </div>
                          <p class="text-[11px] font-semibold leading-snug text-[#2d2d2d]">Rediseñar onboarding</p>
                          <div class="mt-2 flex items-center justify-between">
                            <span class="rounded bg-white px-1.5 py-0.5 text-[8px] font-medium text-[#888] ring-1 ring-[#eee]">UX</span>
                            <span class="h-4 w-4 rounded-full bg-[#5bbce4]" />
                          </div>
                        </div>
                        <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 shadow-sm">
                          <p class="text-[11px] font-semibold leading-snug text-[#2d2d2d]">API de notificaciones</p>
                          <div class="mt-2 flex items-center justify-between">
                            <span class="rounded bg-white px-1.5 py-0.5 text-[8px] font-medium text-[#888] ring-1 ring-[#eee]">Backend</span>
                            <span class="text-[9px] text-[#bbb]">Vie</span>
                          </div>
                        </div>
                        <div class="rounded-lg border border-dashed border-[#e5e5e5] bg-white/60 p-2 opacity-70">
                          <p class="text-[11px] font-medium text-[#aaa]">Brief de campaña Q3</p>
                        </div>
                      </div>

                      <!-- Col: En curso -->
                      <div class="space-y-2">
                        <div class="flex items-center justify-between px-0.5">
                          <span class="text-[10px] font-bold uppercase tracking-wide text-[#5bbce4]">En curso</span>
                          <span class="text-[10px] font-semibold text-[#ccc]">2</span>
                        </div>
                        <div class="rounded-lg border border-[#5bbce4]/35 bg-white p-2 shadow-md ring-1 ring-[#5bbce4]/15">
                          <div class="mb-1.5 flex items-center justify-between">
                            <span class="rounded-full bg-[#e8f6fc] px-1.5 py-0.5 text-[8px] font-bold text-[#2d7eb8]">En progreso</span>
                            <span class="text-[9px] font-medium text-[#f4845f]">Hoy</span>
                          </div>
                          <p class="text-[11px] font-semibold leading-snug text-[#2d2d2d]">Integrar calendario</p>
                          <div class="mt-2 h-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                            <div class="h-full w-2/3 rounded-full bg-[#5bbce4]" />
                          </div>
                          <div class="mt-2 flex -space-x-1">
                            <span class="h-4 w-4 rounded-full bg-[#f4845f] ring-2 ring-white" />
                            <span class="h-4 w-4 rounded-full bg-[#2d2d2d] ring-2 ring-white" />
                          </div>
                        </div>
                        <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 shadow-sm">
                          <p class="text-[11px] font-semibold leading-snug text-[#2d2d2d]">Permisos por rol</p>
                          <div class="mt-2 flex items-center justify-between">
                            <span class="rounded bg-white px-1.5 py-0.5 text-[8px] font-medium text-[#888] ring-1 ring-[#eee]">Admin</span>
                            <span class="h-4 w-4 rounded-full bg-[#f4845f]" />
                          </div>
                        </div>
                      </div>

                      <!-- Col: Hecho -->
                      <div class="space-y-2">
                        <div class="flex items-center justify-between px-0.5">
                          <span class="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Hecho</span>
                          <span class="text-[10px] font-semibold text-[#ccc]">2</span>
                        </div>
                        <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 opacity-80 shadow-sm">
                          <div class="mb-1 flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 :size="11" aria-hidden="true" />
                            <span class="text-[9px] font-semibold">Completado</span>
                          </div>
                          <p class="text-[11px] font-semibold leading-snug text-[#555] line-through decoration-[#ccc]">
                            Setup de workspaces
                          </p>
                        </div>
                        <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 opacity-80 shadow-sm">
                          <div class="mb-1 flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 :size="11" aria-hidden="true" />
                            <span class="text-[9px] font-semibold">Completado</span>
                          </div>
                          <p class="text-[11px] font-semibold leading-snug text-[#555] line-through decoration-[#ccc]">
                            Dashboard métricas
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Logos / trust -->
      <section class="border-y border-[#f0f0f0] bg-[#fafafa] py-8" aria-label="Enfoque de la plataforma">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 text-center text-xs font-semibold uppercase tracking-wider text-[#aaa] lg:px-8">
          <span>Project management</span>
          <span>Software colaborativo</span>
          <span>Tablero Kanban</span>
          <span>Workspace</span>
          <span>Productividad empresarial</span>
        </div>
      </section>

      <!-- Beneficios -->
      <section id="beneficios" class="py-20 lg:py-24" aria-labelledby="beneficios-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div class="mx-auto max-w-2xl text-center landing-reveal">
            <p class="text-sm font-semibold text-[#f4845f]">Beneficios</p>
            <h2 id="beneficios-heading" class="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
              Por qué equipos eligen este gestor de proyectos
            </h2>
            <p class="mt-4 text-[15px] leading-relaxed text-[#666]">
              QuinList es software para empresas que necesitan organización, colaboración en tiempo
              real y un control de tareas sin dispersión de herramientas.
            </p>
          </div>

          <div class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <article
              v-for="(b, i) in benefits"
              :key="b.title"
              class="landing-reveal rounded-2xl border border-[#eee] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#f4845f]/30 hover:shadow-lg hover:shadow-[#f4845f]/10"
              :style="{ transitionDelay: `${i * 60}ms` }"
            >
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff5f0] text-[#f4845f]">
                <component :is="b.icon" :size="22" aria-hidden="true" />
              </div>
              <h3 class="mt-4 text-base font-bold">{{ b.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-[#777]">{{ b.desc }}</p>
            </article>
          </div>

          <div class="mt-10 flex flex-wrap justify-center gap-3 landing-reveal">
            <RouterLink to="/register" class="landing-explore-btn">Comenzar gratis</RouterLink>
            <a href="#contacto" class="landing-demo-btn">Solicitar demostración</a>
          </div>
        </div>
      </section>

      <!-- Características -->
      <section id="caracteristicas" class="bg-[#fafafa] py-20 lg:py-24" aria-labelledby="features-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div class="mx-auto max-w-2xl text-center landing-reveal">
            <p class="text-sm font-semibold text-[#5bbce4]">Características principales</p>
            <h2 id="features-heading" class="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
              Todo lo necesario para gestionar el trabajo
            </h2>
            <p class="mt-4 text-[15px] leading-relaxed text-[#666]">
              De la planificación de proyectos al historial de actividades: una plataforma SaaS
              completa para el seguimiento de proyectos y la administración de equipos.
            </p>
          </div>

          <div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="(f, i) in features"
              :key="f.title"
              class="landing-reveal flex gap-4 rounded-2xl border border-[#eee] bg-white p-5 transition-shadow hover:shadow-md"
              :style="{ transitionDelay: `${(i % 6) * 40}ms` }"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6fc] text-[#2d7eb8]"
              >
                <component :is="f.icon" :size="18" aria-hidden="true" />
              </div>
              <div>
                <h3 class="text-sm font-bold">{{ f.title }}</h3>
                <p class="mt-1 text-sm leading-relaxed text-[#777]">{{ f.desc }}</p>
              </div>
            </article>
          </div>

          <div class="mt-12 overflow-hidden rounded-3xl bg-[#2d2d2d] px-6 py-10 text-center landing-reveal lg:px-12">
            <h3 class="text-xl font-bold text-white lg:text-2xl">
              Una sola plataforma empresarial para tu equipo
            </h3>
            <p class="mx-auto mt-3 max-w-xl text-sm text-white/60">
              Gestión de proyectos, tablero Kanban, archivos adjuntos, comentarios y notificaciones:
              deja de saltar entre apps.
            </p>
            <div class="mt-6 flex flex-wrap justify-center gap-3">
              <RouterLink to="/register" class="landing-explore-btn">Crear cuenta</RouterLink>
              <RouterLink
                to="/login"
                class="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Iniciar sesión
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Cómo funciona -->
      <section id="como-funciona" class="py-20 lg:py-24" aria-labelledby="how-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div class="mx-auto max-w-2xl text-center landing-reveal">
            <p class="text-sm font-semibold text-[#f4845f]">Cómo funciona</p>
            <h2 id="how-heading" class="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
              De cero a workspace productivo en tres pasos
            </h2>
          </div>

          <ol class="mt-14 grid gap-6 md:grid-cols-3">
            <li
              v-for="(s, i) in steps"
              :key="s.step"
              class="landing-reveal relative rounded-2xl border border-[#eee] p-7"
              :style="{ transitionDelay: `${i * 80}ms` }"
            >
              <span class="text-4xl font-extrabold text-[#f4845f]/25">{{ s.step }}</span>
              <h3 class="mt-3 text-lg font-bold">{{ s.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-[#777]">{{ s.desc }}</p>
            </li>
          </ol>

          <div class="mt-10 flex justify-center landing-reveal">
            <RouterLink to="/register" class="landing-explore-btn gap-2">
              Comenzar gratis
              <ArrowRight :size="16" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Casos de uso -->
      <section id="casos-de-uso" class="bg-[#fafafa] py-20 lg:py-24" aria-labelledby="usecases-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div class="mx-auto max-w-2xl text-center landing-reveal">
            <p class="text-sm font-semibold text-[#5bbce4]">Casos de uso</p>
            <h2 id="usecases-heading" class="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
              Hecho para distintos tipos de equipo
            </h2>
            <p class="mt-4 text-[15px] text-[#666]">
              Ya sea product management, operaciones o servicios: el software colaborativo se adapta
              a tu forma de trabajar.
            </p>
          </div>

          <div class="mt-14 grid gap-5 lg:grid-cols-3">
            <article
              v-for="(u, i) in useCases"
              :key="u.title"
              class="landing-reveal flex flex-col rounded-2xl border border-[#eee] bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
              :style="{ transitionDelay: `${i * 70}ms` }"
            >
              <h3 class="text-lg font-bold">{{ u.title }}</h3>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-[#777]">{{ u.desc }}</p>
              <div class="mt-5 flex flex-wrap gap-2">
                <span
                  v-for="tag in u.tags"
                  :key="tag"
                  class="rounded-full bg-[#fff5f0] px-3 py-1 text-xs font-semibold text-[#f4845f]"
                >
                  {{ tag }}
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Reseñas -->
      <section id="opiniones" class="overflow-hidden py-20 lg:py-24" aria-labelledby="testimonials-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div class="mx-auto max-w-2xl text-center landing-reveal">
            <p class="text-sm font-semibold text-[#f4845f]">Reseñas de clientes</p>
            <h2 id="testimonials-heading" class="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
              Valorados con {{ ratingSummary.score }} estrellas
            </h2>
            <p class="mt-3 text-[15px] text-[#666]">
              {{ ratingSummary.displayCount }} reseñas de equipos que usan QuinList para gestionar
              proyectos, tareas y colaboración.
            </p>
          </div>

          <div
            class="landing-reveal mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl border border-[#eee] bg-white px-8 py-6 shadow-sm sm:flex-row sm:justify-center sm:gap-6"
          >
            <div class="text-center sm:text-left">
              <p class="text-4xl font-extrabold tracking-tight text-[#2d2d2d]">{{ ratingSummary.score }}</p>
              <div class="mt-1 flex justify-center gap-0.5 sm:justify-start" aria-hidden="true">
                <Star
                  v-for="n in 5"
                  :key="n"
                  :size="16"
                  class="fill-[#f4845f] text-[#f4845f]"
                />
              </div>
            </div>
            <div class="mt-3 h-px w-16 bg-[#eee] sm:mt-0 sm:h-12 sm:w-px" aria-hidden="true" />
            <p class="mt-3 max-w-[220px] text-center text-sm leading-relaxed text-[#666] sm:mt-0 sm:text-left">
              Calificación promedio basada en
              <span class="font-semibold text-[#2d2d2d]">{{ ratingSummary.displayCount }} reseñas</span>
              de clientes.
            </p>
          </div>
        </div>

        <div class="mt-10 landing-reveal">
          <LandingReviewsCarousel :reviews="reviews" />
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="bg-[#fafafa] py-20 lg:py-24" aria-labelledby="faq-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div class="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-14">
            <!-- Intro -->
            <div class="landing-reveal lg:sticky lg:top-28 lg:self-start">
              <p class="text-sm font-semibold text-[#5bbce4]">Preguntas frecuentes</p>
              <h2 id="faq-heading" class="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
                Todo lo que necesitas saber
              </h2>
              <p class="mt-4 text-[15px] leading-relaxed text-[#666]">
                Respuestas claras sobre el software de gestión de proyectos, workspaces, roles y cómo
                empezar con QuinList.
              </p>

              <div class="mt-6 inline-flex items-center gap-3 rounded-2xl border border-[#eee] bg-white px-4 py-3 shadow-sm">
                <div class="flex gap-0.5" aria-hidden="true">
                  <Star
                    v-for="n in 5"
                    :key="n"
                    :size="14"
                    class="fill-[#f4845f] text-[#f4845f]"
                  />
                </div>
                <div>
                  <p class="text-sm font-bold text-[#2d2d2d]">{{ ratingSummary.score }} / 5</p>
                  <p class="text-xs text-[#888]">{{ ratingSummary.displayCount }} reseñas de clientes</p>
                </div>
              </div>

              <div class="mt-8 rounded-2xl border border-[#2d2d2d]/8 bg-[#2d2d2d] p-6 text-white">
                <p class="text-sm font-bold">¿Aún tienes dudas?</p>
                <p class="mt-2 text-sm leading-relaxed text-white/65">
                  Habla con nosotros o crea tu cuenta y pruébalo en minutos.
                </p>
                <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <RouterLink to="/register" class="landing-nav-cta justify-center text-center">
                    Comenzar gratis
                  </RouterLink>
                  <a
                    href="mailto:contacto@matubyte.com"
                    class="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Mail :size="15" aria-hidden="true" />
                    Contactar
                  </a>
                </div>
              </div>
            </div>

            <!-- Accordion -->
            <div class="landing-reveal space-y-3" role="list">
              <div
                v-for="(item, i) in faqs"
                :key="item.q"
                class="landing-faq-item overflow-hidden rounded-2xl border bg-white transition-all duration-300"
                :class="
                  openFaq === i
                    ? 'border-[#f4845f]/40 shadow-lg shadow-[#f4845f]/10'
                    : 'border-[#eee] hover:border-[#ddd]'
                "
                role="listitem"
              >
                <button
                  type="button"
                  class="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors"
                  :aria-expanded="openFaq === i"
                  :aria-controls="`faq-panel-${i}`"
                  @click="toggleFaq(i)"
                >
                  <span
                    class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors"
                    :class="
                      openFaq === i
                        ? 'bg-[#f4845f] text-white'
                        : 'bg-[#f5f5f5] text-[#888]'
                    "
                    aria-hidden="true"
                  >
                    {{ String(i + 1).padStart(2, '0') }}
                  </span>
                  <span class="flex-1 pt-0.5 text-[15px] font-bold leading-snug text-[#2d2d2d]">
                    {{ item.q }}
                  </span>
                  <span
                    class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                    :class="
                      openFaq === i
                        ? 'rotate-45 bg-[#fff5f0] text-[#f4845f]'
                        : 'bg-[#f7f7f7] text-[#999]'
                    "
                    aria-hidden="true"
                  >
                    <Plus :size="16" />
                  </span>
                </button>
                <div
                  :id="`faq-panel-${i}`"
                  class="grid transition-[grid-template-rows] duration-300 ease-out"
                  :class="openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                >
                  <div class="overflow-hidden">
                    <p class="border-t border-[#f3f3f3] px-5 py-4 pl-[3.75rem] text-sm leading-relaxed text-[#666]">
                      {{ item.a }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA + Contacto demo -->
      <section id="contacto" class="py-20 lg:py-24" aria-labelledby="cta-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div
            class="landing-reveal relative overflow-hidden rounded-[2rem] bg-[#2d2d2d] px-6 py-12 sm:px-10 lg:px-16 lg:py-16"
          >
            <div
              class="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style="
                background:
                  radial-gradient(ellipse 70% 80% at 0% 0%, rgba(244, 132, 95, 0.28), transparent 55%),
                  radial-gradient(ellipse 60% 70% at 100% 100%, rgba(91, 188, 228, 0.22), transparent 50%);
              "
            />
            <div
              class="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
              aria-hidden="true"
            />

            <div class="relative mx-auto max-w-3xl text-center">
              <div
                class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-sm"
              >
                <span class="flex gap-0.5" aria-hidden="true">
                  <Star
                    v-for="n in 5"
                    :key="n"
                    :size="12"
                    class="fill-[#f4845f] text-[#f4845f]"
                  />
                </span>
                <span class="text-xs font-semibold text-white/85">
                  {{ ratingSummary.score }} · {{ ratingSummary.displayCount }} reseñas
                </span>
              </div>

              <h2 id="cta-heading" class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                Empieza a organizar tu trabajo hoy
              </h2>
              <p class="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">
                Únete a equipos que ya usan QuinList para gestión de proyectos, tableros Kanban y
                colaboración en tiempo real. Sin tarjeta para comenzar.
              </p>

              <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                <RouterLink to="/register" class="landing-explore-btn gap-2 px-8">
                  Comenzar gratis
                  <ArrowRight :size="16" aria-hidden="true" />
                </RouterLink>
                <a
                  href="mailto:contacto@matubyte.com?subject=Solicitud%20de%20demostraci%C3%B3n%20QuinList"
                  class="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
                >
                  Solicitar demostración
                </a>
              </div>

              <p class="mt-5 text-sm text-white/45">
                ¿Ya tienes cuenta?
                <RouterLink to="/login" class="font-semibold text-white/85 underline-offset-2 hover:text-white hover:underline">
                  Iniciar sesión
                </RouterLink>
              </p>

              <div class="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-center sm:gap-6">
                <a
                  href="mailto:contacto@matubyte.com"
                  class="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
                >
                  <Mail :size="15" aria-hidden="true" />
                  contacto@matubyte.com
                </a>
                <span class="hidden h-3 w-px bg-white/15 sm:block" aria-hidden="true" />
                <p class="text-sm text-white/45">Soporte y contacto · MatuByte S.A.S.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-[#eee] bg-[#fafafa]" aria-labelledby="footer-heading">
      <h2 id="footer-heading" class="sr-only">Pie de página QuinList</h2>
      <div class="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div class="lg:col-span-1">
            <RouterLink to="/" class="flex items-center gap-2.5" aria-label="QuinList">
              <AppLogo size="sm" />
              <span class="text-base font-extrabold">QuinList</span>
            </RouterLink>
            <p class="mt-4 text-sm leading-relaxed text-[#777]">
              Software de gestión de proyectos y colaboración para equipos. Tableros Kanban,
              workspaces y productividad empresarial en una plataforma SaaS.
            </p>
            <a
              href="mailto:contacto@matubyte.com"
              class="mt-4 inline-block text-sm font-medium text-[#f4845f] hover:underline"
            >
              contacto@matubyte.com
            </a>
            <div class="mt-4 flex gap-3">
              <a
                href="https://www.linkedin.com/company/matubyte"
                target="_blank"
                rel="noopener noreferrer"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] text-[#666] transition-colors hover:border-[#f4845f] hover:text-[#f4845f]"
                aria-label="LinkedIn de MatuByte"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                  />
                </svg>
              </a>
              <a
                href="https://x.com/matubyte"
                target="_blank"
                rel="noopener noreferrer"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] text-[#666] transition-colors hover:border-[#f4845f] hover:text-[#f4845f]"
                aria-label="X (Twitter) de MatuByte"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/matubyte"
                target="_blank"
                rel="noopener noreferrer"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] text-[#666] transition-colors hover:border-[#f4845f] hover:text-[#f4845f]"
                aria-label="Instagram de MatuByte"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-bold text-[#2d2d2d]">Enlaces rápidos</h3>
            <ul class="mt-4 space-y-2.5 text-sm text-[#666]">
              <li><a href="#beneficios" class="hover:text-[#f4845f]">Beneficios</a></li>
              <li><a href="#caracteristicas" class="hover:text-[#f4845f]">Características</a></li>
              <li><a href="#como-funciona" class="hover:text-[#f4845f]">Cómo funciona</a></li>
              <li><a href="#casos-de-uso" class="hover:text-[#f4845f]">Casos de uso</a></li>
              <li><a href="#faq" class="hover:text-[#f4845f]">FAQ</a></li>
              <li>
                <RouterLink to="/register" class="hover:text-[#f4845f]">Comenzar gratis</RouterLink>
              </li>
              <li>
                <RouterLink to="/login" class="hover:text-[#f4845f]">Iniciar sesión</RouterLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="text-sm font-bold text-[#2d2d2d]">Características</h3>
            <ul class="mt-4 space-y-2.5 text-sm text-[#666]">
              <li>Gestión de proyectos</li>
              <li>Tablero Kanban</li>
              <li>Gestión de tareas</li>
              <li>Colaboración en tiempo real</li>
              <li>Dashboard con métricas</li>
              <li>Roles y permisos</li>
            </ul>
          </div>

          <div>
            <h3 class="text-sm font-bold text-[#2d2d2d]">Centro de ayuda</h3>
            <ul class="mt-4 space-y-2.5 text-sm text-[#666]">
              <li>
                <RouterLink to="/ayuda" class="hover:text-[#f4845f]">Centro de ayuda</RouterLink>
              </li>
              <li>
                <RouterLink to="/privacidad" class="hover:text-[#f4845f]">Política de privacidad</RouterLink>
              </li>
              <li>
                <RouterLink to="/terminos" class="hover:text-[#f4845f]">Términos y condiciones</RouterLink>
              </li>
              <li>
                <a href="mailto:contacto@matubyte.com" class="hover:text-[#f4845f]">Contacto</a>
              </li>
              <li>
                <a
                  href="https://matubyte.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-[#f4845f]"
                  >Sitio oficial MatuByte</a
                >
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-12 border-t border-[#e8e8e8] pt-8 text-center text-sm text-[#888]">
          <p>
            Hecho con <span class="text-[#f4845f]" aria-label="amor">❤️</span> por
            <a
              href="https://matubyte.com"
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-[#2d2d2d] hover:text-[#f4845f]"
              >MatuByte S.A.S.</a
            >
          </p>
          <p class="mt-2">
            MatuByte S.A.S. · Sitio web oficial:
            <a
              href="https://matubyte.com"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-[#f4845f]"
              >https://matubyte.com</a
            >
          </p>
          <p class="mt-2">
            © {{ year }} QuinList · MatuByte S.A.S. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
