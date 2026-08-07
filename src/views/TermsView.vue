<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/brand/AppLogo.vue'

const year = new Date().getFullYear()
</script>

<template>
  <div class="min-h-full bg-white text-[#2d2d2d]">
    <header class="border-b border-[#eee]">
      <div class="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <RouterLink to="/" class="flex items-center gap-2" aria-label="QuinList — volver al inicio">
          <AppLogo size="sm" />
          <span class="text-sm font-bold">QuinList</span>
        </RouterLink>
        <RouterLink to="/" class="text-sm font-medium text-[#666] hover:text-[#2d2d2d]">Inicio</RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-5 py-12">
      <nav class="text-sm text-[#888]" aria-label="Miga de pan">
        <RouterLink to="/" class="hover:text-[#2d2d2d]">Inicio</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-[#2d2d2d]">Términos y condiciones</span>
      </nav>

      <h1 class="mt-6 text-3xl font-extrabold tracking-tight">Términos y condiciones</h1>
      <p class="mt-2 text-sm text-[#888]">Última actualización: {{ year }}</p>

      <div class="mt-8 space-y-6 text-sm leading-relaxed text-[#555]">
        <p>
          Al acceder o usar QuinList, el software de gestión de proyectos de
          <strong>MatuByte S.A.S.</strong>, aceptas estos términos. Si no estás de acuerdo, no
          utilices la plataforma.
        </p>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">1. Servicio</h2>
          <p class="mt-2">
            QuinList es un software SaaS para planificación de proyectos, gestión de tareas,
            tableros Kanban, administración de equipos y colaboración en tiempo real.
          </p>
        </section>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">2. Cuentas y responsabilidades</h2>
          <p class="mt-2">
            Eres responsable de la confidencialidad de tus credenciales y del contenido que
            publiques en tu workspace. Debes usar el servicio conforme a la ley y sin abusar de la
            plataforma.
          </p>
        </section>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">3. Propiedad intelectual</h2>
          <p class="mt-2">
            QuinList, su marca, interfaz y código son propiedad de MatuByte S.A.S. El contenido que
            creas en proyectos y tareas sigue siendo tuyo.
          </p>
        </section>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">4. Limitación de responsabilidad</h2>
          <p class="mt-2">
            El servicio se ofrece “tal cual”. En la medida permitida por la ley, MatuByte S.A.S. no
            responde por daños indirectos derivados del uso del gestor de proyectos.
          </p>
        </section>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">5. Contacto</h2>
          <p class="mt-2">
            <a href="mailto:contacto@matubyte.com" class="font-medium text-[#f4845f] hover:underline"
              >contacto@matubyte.com</a
            >
            ·
            <a
              href="https://matubyte.com"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-[#f4845f] hover:underline"
              >matubyte.com</a
            >
          </p>
        </section>
      </div>
    </main>

    <footer class="border-t border-[#eee] py-8 text-center text-sm text-[#888]">
      <p>© {{ year }} QuinList · MatuByte S.A.S. Todos los derechos reservados.</p>
    </footer>
  </div>
</template>
