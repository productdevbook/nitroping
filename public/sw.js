// Service Worker for Push Notifications
// NitroPing v0.0.1

const DB_NAME = 'nitroping-sw'
const STORE_NAME = 'pending-events'
const DB_VERSION = 1

// IndexedDB helper functions
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function queueTrackingEvent(event) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.add({ ...event, timestamp: Date.now() })
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  }
  catch (error) {
    console.error('[SW] Failed to queue tracking event:', error)
  }
}

async function getPendingEvents() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        db.close()
        resolve(request.result || [])
      }
      request.onerror = () => {
        db.close()
        reject(request.error)
      }
    })
  }
  catch (error) {
    console.error('[SW] Failed to get pending events:', error)
    return []
  }
}

async function deleteEvent(id) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  }
  catch (error) {
    console.error('[SW] Failed to delete event:', error)
  }
}

// Track notification events
async function trackNotificationEvent(type, notificationId, deviceId, action = null) {
  if (!notificationId || !deviceId) {
    console.warn('[SW] Missing notificationId or deviceId for tracking')
    return
  }

  const apiUrl = globalThis.registration.scope.replace(/\/$/, '')

  const mutationMap = {
    Delivered: 'trackNotificationDelivered',
    Opened: 'trackNotificationOpened',
    Clicked: 'trackNotificationClicked',
  }

  const mutationName = mutationMap[type]
  if (!mutationName) {
    console.warn('[SW] Unknown tracking type:', type)
    return
  }

  const query = `
    mutation Track($notificationId: ID!, $deviceId: ID!${action ? ', $action: String' : ''}) {
      ${mutationName}(notificationId: $notificationId, deviceId: $deviceId${action ? ', action: $action' : ''})
    }
  `

  const variables = { notificationId, deviceId }
  if (action) {
    variables.action = action
  }

  try {
    const response = await fetch(`${apiUrl}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    console.log(`[SW] Tracked ${type} for notification ${notificationId}`)
    return true
  }
  catch (error) {
    console.error(`[SW] Failed to track ${type}:`, error)

    // Queue for later sync
    await queueTrackingEvent({
      type,
      notificationId,
      deviceId,
      action,
    })

    // Request background sync if available
    if (globalThis.registration.sync) {
      try {
        await globalThis.registration.sync.register('sync-tracking')
      }
      catch {
        // Sync not supported or failed
      }
    }

    return false
  }
}

// Sync pending tracking events
async function syncPendingEvents() {
  const events = await getPendingEvents()

  if (events.length === 0) {
    return
  }

  console.log(`[SW] Syncing ${events.length} pending tracking events`)

  for (const event of events) {
    const success = await trackNotificationEvent(
      event.type,
      event.notificationId,
      event.deviceId,
      event.action,
    )

    if (success) {
      await deleteEvent(event.id)
    }
  }
}

// Install event
globalThis.addEventListener('install', () => {
  console.log('[SW] Installing...')
  globalThis.skipWaiting()
})

// Activate event
globalThis.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(globalThis.clients.claim())
})

// Handle push events
globalThis.addEventListener('push', (event) => {
  console.log('[SW] Push event received')

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
    image: data.image,
    data: {
      ...data.data,
      nitroping_notification_id: data.nitroping_notification_id,
      nitroping_device_id: data.nitroping_device_id,
      url: data.url || data.clickAction || '/',
    },
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    silent: data.silent || false,
    renotify: data.renotify || false,
    timestamp: data.timestamp || Date.now(),
  }

  event.waitUntil(
    (async () => {
      // Show notification
      await globalThis.registration.showNotification(data.title || 'Notification', options)

      // Track delivery
      if (data.nitroping_notification_id && data.nitroping_device_id) {
        await trackNotificationEvent(
          'Delivered',
          data.nitroping_notification_id,
          data.nitroping_device_id,
        )
      }
    })(),
  )
})

// Handle notification click
globalThis.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')

  event.notification.close()

  const notificationData = event.notification.data || {}
  const notificationId = notificationData.nitroping_notification_id
  const deviceId = notificationData.nitroping_device_id
  const url = notificationData.url || '/'
  const action = event.action || null

  event.waitUntil(
    (async () => {
      // Track click
      if (notificationId && deviceId) {
        await trackNotificationEvent('Clicked', notificationId, deviceId, action)
      }

      // Handle action clicks
      if (action) {
        console.log('[SW] Action clicked:', action)
        // You can handle specific actions here
      }

      // Open/focus the app
      const clientList = await globalThis.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(globalThis.location.origin) && 'focus' in client) {
          await client.focus()
          if (url !== '/') {
            client.postMessage({ type: 'NOTIFICATION_CLICK', url, action })
          }
          return
        }
      }

      // If no window is open, open a new one
      if (globalThis.clients.openWindow) {
        await globalThis.clients.openWindow(url)
      }
    })(),
  )
})

// Handle notification close
globalThis.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed')

  const notificationData = event.notification.data || {}
  const notificationId = notificationData.nitroping_notification_id
  const deviceId = notificationData.nitroping_device_id

  // Track notification close as "opened" (user saw it)
  if (notificationId && deviceId) {
    event.waitUntil(
      trackNotificationEvent('Opened', notificationId, deviceId),
    )
  }
})

// Handle background sync
globalThis.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tracking') {
    event.waitUntil(syncPendingEvents())
  }
})

// Handle messages from the main app
globalThis.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    globalThis.skipWaiting()
  }

  if (event.data === 'syncPending') {
    event.waitUntil(syncPendingEvents())
  }
})

console.log('[SW] NitroPing Service Worker loaded')
