import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { createNotivue } from 'notivue'
import 'notivue/notifications.css'
import 'notivue/animations.css'
import './style.css'
import App from './App.vue'
import { router } from './router'

const notivue = createNotivue({
  position: 'top-center',
  limit: 3,
  notifications: {
    global: {
      duration: 3000,
    },
  },
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(PiniaColada)
app.use(router)
app.use(notivue)

app.mount('#app')
