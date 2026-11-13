import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  plugins: [vue(), vueJsx(), mode === 'development' ? vueDevTools() : null, tailwindcss()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // Vite 8 + Rolldown minifica con Oxc por defecto (esbuild ya no viene embebido).
    minify: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            // Grupos explícitos sin arrastrar dependencias: así la landing no descarga
            // vuedraggable/sortable (solo los usa la app privada).
            codeSplitting: {
              includeDependenciesRecursively: false,
              groups: [
                { name: 'vendor-vue', test: /node_modules[\/](@vue|vue|vue-router|pinia)[\/]/, priority: 40 },
                { name: 'vendor-dnd', test: /node_modules[\/](vuedraggable|sortablejs)[\/]/, priority: 30 },
                { name: 'vendor-icons', test: /node_modules[\/]@lucide[\/]/, priority: 20 },
                { name: 'vendor-qr', test: /node_modules[\/]qrcode[\/]/, priority: 20 },
              ],
            },
          },
        },
    chunkSizeWarningLimit: 900,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4012',
        changeOrigin: true,
      },
    },
    headers: {
      'Cache-Control': 'no-store',
      // Allows Google OAuth popup ↔ opener postMessage (avoids noisy COOP blocks).
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Embeber QuinList dentro de Sizor (Tableros)
      'Content-Security-Policy':
        "frame-ancestors 'self' https://sizor.online https://*.sizor.online http://localhost:5173 http://127.0.0.1:5173",
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy':
        "frame-ancestors 'self' https://sizor.online https://*.sizor.online http://localhost:5173 http://127.0.0.1:5173",
    },
  },
}))
