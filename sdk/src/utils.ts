import { NitroPingError } from './types.ts'

/**
 * Converts a VAPID public key from base64url format to Uint8Array for use with the Push API
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = globalThis.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Generates a random user ID for anonymous users
 */
export function generateUserId(): string {
  return `user-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`
}

/**
 * Checks if the current environment supports push notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof globalThis !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in globalThis
    && 'Notification' in globalThis
  )
}

/**
 * Checks if we're running in a secure context (required for push notifications)
 */
export function isSecureContext(): boolean {
  return globalThis.isSecureContext === true
}

/**
 * Gets the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission
}

/**
 * Makes an HTTP request to the NitroPing API
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      const errorData = JSON.parse(errorText)
      errorMessage = errorData.message || errorMessage
    }
    catch {
      // If it's not JSON, use the raw text
      if (errorText) {
        errorMessage = errorText
      }
    }

    throw new NitroPingError(
      errorMessage,
      'API_ERROR',
      response.status,
    )
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  return response.text() as T
}

/**
 * Stores data in localStorage with error handling
 */
export function setLocalStorage(key: string, value: any): void {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value))
  }
  catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

/**
 * Retrieves data from localStorage with error handling
 */
export function getLocalStorage<T = any>(key: string): T | null {
  try {
    const item = globalThis.localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }
  catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return null
  }
}

/**
 * Removes data from localStorage
 */
export function removeLocalStorage(key: string): void {
  try {
    globalThis.localStorage.removeItem(key)
  }
  catch (error) {
    console.warn('Failed to remove from localStorage:', error)
  }
}
