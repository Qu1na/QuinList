import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useQuinListStore } from './stores/quinlist'
import { useNotificationStore } from './stores/notifications'
import { useProjectsStore } from './stores/projects'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

async function bootstrap() {
  const auth = useAuthStore()
  await auth.init()

  // Mount immediately so the shell renders while MatuDB data loads in background.
  app.mount('#app')

  if (!auth.isAuthenticated) return

  const store = useQuinListStore()
  const notif = useNotificationStore()
  const projects = useProjectsStore()

  void (async () => {
    try {
      await store.init()
      await Promise.all([notif.init(), projects.init()])
    } catch (err) {
      console.error('[bootstrap] Error cargando datos:', err)
    }
  })()
}

bootstrap()
