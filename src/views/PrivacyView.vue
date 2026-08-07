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
        <span class="text-[#2d2d2d]">Política de privacidad</span>
      </nav>

      <h1 class="mt-6 text-3xl font-extrabold tracking-tight">Política de privacidad</h1>
      <p class="mt-2 text-sm text-[#888]">Última actualización: {{ year }}</p>

      <div class="mt-8 space-y-6 text-sm leading-relaxed text-[#555]">
        <p>
          QuinList, operado por <strong>MatuByte S.A.S.</strong>, es un software SaaS de gestión de
          proyectos y colaboración. Esta política describe cómo recopilamos, usamos y protegemos la
          información cuando utilizas nuestra plataforma empresarial.
        </p>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">1. Datos que recopilamos</h2>
          <p class="mt-2">
            Datos de cuenta (nombre, correo), datos de uso del workspace (proyectos, tareas,
            tableros Kanban) y datos técnicos necesarios para seguridad y rendimiento.
          </p>
        </section>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">2. Uso de la información</h2>
          <p class="mt-2">
            Utilizamos los datos para prestar el servicio de project management, autenticación,
            notificaciones, soporte y mejora de la productividad empresarial en la plataforma.
          </p>
        </section>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">3. Conservación y seguridad</h2>
          <p class="mt-2">
            Aplicamos medidas razonables de seguridad. Conservamos la información mientras la cuenta
            esté activa o según obligaciones legales.
          </p>
        </section>
        <section>
          <h2 class="text-lg font-bold text-[#2d2d2d]">4. Contacto</h2>
          <p class="mt-2">
            Para ejercer derechos o consultas:
            <a href="mailto:contacto@matubyte.com" class="font-medium text-[#f4845f] hover:underline"
              >contacto@matubyte.com</a
            >.
            Sitio oficial de MatuByte:
            <a
              href="https://matubyte.com"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-[#f4845f] hover:underline"
              >https://matubyte.com</a
            >.
          </p>
        </section>
      </div>
    </main>

    <footer class="border-t border-[#eee] py-8 text-center text-sm text-[#888]">
      <p>© {{ year }} QuinList · MatuByte S.A.S. Todos los derechos reservados.</p>
    </footer>
  </div>
</template>
