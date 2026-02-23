import { eq } from 'drizzle-orm'
import { getDatabase } from '#server/database/connection'
import { app } from '#server/database/schema'
import { decryptSensitiveData, isDataEncrypted } from '#server/utils/crypto'
import { APNsProvider } from './apns'
import { FCMProvider } from './fcm'
import { WebPushProvider } from './webpush'

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
    case 'android': {
      // Use FCM for Android
      if (!appData.fcmProjectId || !appData.fcmServerKey) {
        throw new Error('FCM not configured for this app (missing project ID or server key)')
      }

      // Decrypt the service account key if it's encrypted
      const serviceAccountKey = isDataEncrypted(appData.fcmServerKey)
        ? decryptSensitiveData(appData.fcmServerKey)
        : appData.fcmServerKey

      return new FCMProvider({
        projectId: appData.fcmProjectId,
        serviceAccountKey,
      })
    }

    case 'ios': {
      // Use APNs for iOS
      if (!appData.apnsKeyId || !appData.apnsTeamId || !appData.apnsCertificate) {
        throw new Error('APNs not configured for this app (missing key ID, team ID, or certificate)')
      }

      // Decrypt the private key if it's encrypted
      const privateKey = isDataEncrypted(appData.apnsCertificate)
        ? decryptSensitiveData(appData.apnsCertificate)
        : appData.apnsCertificate

      if (!appData.bundleId) {
        throw new Error('iOS Bundle ID not configured for this app')
      }

      return new APNsProvider({
        keyId: appData.apnsKeyId,
        teamId: appData.apnsTeamId,
        bundleId: appData.bundleId,
        privateKey,
        production: process.env.NODE_ENV === 'production',
      })
    }

    case 'web': {
      // Use Web Push
      if (!appData.vapidPublicKey || !appData.vapidPrivateKey || !appData.vapidSubject) {
        throw new Error('Web Push not configured for this app (missing VAPID keys or subject)')
      }

      // Decrypt the private key if it's encrypted
      const vapidPrivateKey = isDataEncrypted(appData.vapidPrivateKey)
        ? decryptSensitiveData(appData.vapidPrivateKey)
        : appData.vapidPrivateKey

      return new WebPushProvider({
        vapidSubject: appData.vapidSubject,
        publicKey: appData.vapidPublicKey,
        privateKey: vapidPrivateKey,
      })
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
