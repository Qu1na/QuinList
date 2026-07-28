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

  if (auth.isAuthenticated) {
    const store = useQuinListStore()
    const notif = useNotificationStore()
    const projects = useProjectsStore()
    await Promise.all([store.init(), notif.init(), projects.init()])
  }

  app.mount('#app')
}

bootstrap()
