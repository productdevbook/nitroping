// Service Worker for Push Notifications
globalThis.addEventListener('install', () => {
  console.log('Service Worker installing...')
  globalThis.skipWaiting()
})

globalThis.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(globalThis.clients.claim())
})

// Handle push events
globalThis.addEventListener('push', (event) => {
  console.log('Push event received:', event)

  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    }
    catch {
      data = {
        title: 'Notification',
        body: event.data.text() || 'You have a new message',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      }
    }
  }

  const options = {
    body: data.body || 'You have a new message',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: data.data || {},
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  }

  event.waitUntil(
    globalThis.registration.showNotification(data.title || 'Notification', options),
  )
})

// Handle notification click
globalThis.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification)

  event.notification.close()

  // Handle action clicks
  if (event.action) {
    console.log('Action clicked:', event.action)
  }
  else {
    // Default click - open/focus the app
    event.waitUntil(
      globalThis.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(globalThis.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }

        // If no window is open, open a new one
        if (globalThis.clients.openWindow) {
          return globalThis.clients.openWindow('/')
        }
      }),
    )
  }
})

// Handle notification close
globalThis.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification)

  // Track notification close if needed
  // You can send analytics data here
})
