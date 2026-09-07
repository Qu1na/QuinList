import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    vueJsx(),
    mode === 'development' ? vueDevTools() : null,
    tailwindcss(),
  ].filter(Boolean),
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
            return 'vendor-vue'
          }
          if (id.includes('@lucide')) return 'vendor-icons'
          if (id.includes('vuedraggable') || id.includes('sortablejs')) return 'vendor-dnd'
          if (id.includes('qrcode')) return 'vendor-qr'
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  server: {
    headers: {
      'Cache-Control': 'no-store',
      // Allows Google OAuth popup ↔ opener postMessage (avoids noisy COOP blocks).
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
}))
