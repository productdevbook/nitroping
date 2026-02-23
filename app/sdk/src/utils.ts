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

/**
 * Detects the browser type from user agent
 */
export function detectBrowser(): string {
  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return 'chrome'
  }
  if (userAgent.includes('firefox')) {
    return 'firefox'
  }
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'safari'
  }
  if (userAgent.includes('edg')) {
    return 'edge'
  }
  if (userAgent.includes('opera')) {
    return 'opera'
  }

  return 'unknown'
}

/**
 * Detects the operating system from user agent
 */
export function detectOS(): string {
  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('mac')) {
    return 'mac'
  }
  if (userAgent.includes('win')) {
    return 'windows'
  }
  if (userAgent.includes('linux')) {
    return 'linux'
  }
  if (userAgent.includes('android')) {
    return 'android'
  }
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'ios'
  }

  return 'unknown'
}

/**
 * Gets browser version from user agent
 */
export function getBrowserVersion(): string {
  const userAgent = navigator.userAgent
  const browser = detectBrowser()

  try {
    let match: RegExpMatchArray | null = null

    switch (browser) {
      case 'chrome':
        match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)
        break
      case 'firefox':
        match = userAgent.match(/Firefox\/(\d+\.\d+)/)
        break
      case 'safari':
        match = userAgent.match(/Version\/(\d+\.\d+)/)
        break
      case 'edge':
        match = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/)
        break
      case 'opera':
        match = userAgent.match(/OPR\/(\d+\.\d+\.\d+\.\d+)/)
        break
    }

    return match ? match[1] : 'unknown'
  }
  catch {
    return 'unknown'
  }
}

/**
 * Maps browser type to category enum value (only for supported browsers)
 */
export function getCategoryFromBrowser(browser: string): string {
  switch (browser.toLowerCase()) {
    case 'chrome':
      return 'CHROME'
    case 'firefox':
      return 'FIREFOX'
    case 'safari':
      return 'SAFARI'
    case 'edge':
      return 'EDGE'
    case 'opera':
      return 'OPERA'
    default:
      return 'WEB' // Will be filtered out in SDK
  }
}
