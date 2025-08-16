import { FCMProvider } from './fcm'
import { APNsProvider } from './apns'
import { WebPushProvider } from './webpush'
import { getDatabase } from '~~/server/database/connection'
import { app } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export interface ProviderResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface BatchProviderResult {
  success: boolean
  results: ProviderResult[]
  successCount: number
  failureCount: number
}

export async function getProviderForApp(appId: string, platform: 'ios' | 'android' | 'web') {
  const db = getDatabase()
  
  const appResult = await db
    .select()
    .from(app)
    .where(eq(app.id, appId))
    .limit(1)

  if (appResult.length === 0) {
    throw new Error('App not found')
  }

  const appData = appResult[0]!

  switch (platform) {
    case 'android':
      // Use FCM for Android
      if (!appData.fcmProjectId || !appData.fcmServerKey) {
        throw new Error('FCM not configured for this app (missing project ID or server key)')
      }
      
      return new FCMProvider({
        projectId: appData.fcmProjectId,
        serviceAccountKey: appData.fcmServerKey
      })

    case 'ios':
      // Use APNs for iOS
      if (!appData.apnsKeyId || !appData.apnsTeamId || !appData.apnsCertificate) {
        throw new Error('APNs not configured for this app (missing key ID, team ID, or certificate)')
      }
      
      return new APNsProvider({
        keyId: appData.apnsKeyId,
        teamId: appData.apnsTeamId,
        bundleId: appData.slug, // Use app slug as bundle ID for now
        privateKey: appData.apnsCertificate,
        production: process.env.NODE_ENV === 'production'
      })

    case 'web':
      // Use Web Push
      if (!appData.vapidPublicKey || !appData.vapidPrivateKey || !appData.vapidSubject) {
        throw new Error('Web Push not configured for this app (missing VAPID keys or subject)')
      }
      
      return new WebPushProvider({
        vapidSubject: appData.vapidSubject,
        publicKey: appData.vapidPublicKey,
        privateKey: appData.vapidPrivateKey
      })

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}