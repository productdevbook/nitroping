import { PiniaColada } from '@pinia/colada'
import { createNotivue } from 'notivue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import 'notivue/notifications.css'
import 'notivue/animations.css'
import './style.css'

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
