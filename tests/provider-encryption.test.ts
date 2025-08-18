import { randomBytes } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { decryptSensitiveData, encryptSensitiveData, isDataEncrypted } from '../server/utils/crypto'

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
}

// Mock Drizzle ORM
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value })),
}))

vi.mock('~~/server/database/connection', () => ({
  getDatabase: () => mockDb,
}))

vi.mock('~~/server/database/schema', () => ({
  app: { id: 'app_id_column' },
}))

describe('provider Encryption Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex')
  })

  describe('getProviderForApp', async () => {
    const { getProviderForApp } = await import('../server/providers/index')

    it('should decrypt APNS private key when creating provider', async () => {
      const originalPrivateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgTest+Private+Key+Data
-----END PRIVATE KEY-----`

      const encryptedPrivateKey = encryptSensitiveData(originalPrivateKey)

      // Mock app data with encrypted private key
      mockDb.limit.mockResolvedValue([{
        id: 'test-app-id',
        apnsKeyId: 'test-key-id',
        apnsTeamId: 'test-team-id',
        apnsCertificate: encryptedPrivateKey,
        bundleId: 'com.example.testapp',
        slug: 'test-app',
      }])

      const provider = await getProviderForApp('test-app-id', 'ios')

      expect(provider).toBeDefined()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should handle unencrypted legacy private keys', async () => {
      const legacyPrivateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgLegacy+Key+Data
-----END PRIVATE KEY-----`

      // Mock app data with unencrypted private key (legacy)
      mockDb.limit.mockResolvedValue([{
        id: 'test-app-id',
        apnsKeyId: 'test-key-id',
        apnsTeamId: 'test-team-id',
        apnsCertificate: legacyPrivateKey, // Not encrypted
        bundleId: 'com.example.testapp',
        slug: 'test-app',
      }])

      const provider = await getProviderForApp('test-app-id', 'ios')

      expect(provider).toBeDefined()
    })

    it('should decrypt VAPID private key for WebPush', async () => {
      const originalVapidKey = 'BNExampleVapidPrivateKeyData123456789'
      const encryptedVapidKey = encryptSensitiveData(originalVapidKey)

      // Mock app data with encrypted VAPID private key
      mockDb.limit.mockResolvedValue([{
        id: 'test-app-id',
        vapidPublicKey: 'public-key-data',
        vapidPrivateKey: encryptedVapidKey,
        vapidSubject: 'mailto:test@example.com',
        slug: 'test-app',
      }])

      const provider = await getProviderForApp('test-app-id', 'web')

      expect(provider).toBeDefined()
    })

    it('should throw error if app not found', async () => {
      mockDb.limit.mockResolvedValue([]) // No app found

      await expect(getProviderForApp('non-existent-app', 'ios'))
        .rejects
        .toThrow('App not found')
    })

    it('should throw error if APNS config incomplete', async () => {
      mockDb.limit.mockResolvedValue([{
        id: 'test-app-id',
        apnsKeyId: null, // Missing key ID
        apnsTeamId: 'test-team-id',
        apnsCertificate: 'some-cert',
        slug: 'test-app',
      }])

      await expect(getProviderForApp('test-app-id', 'ios'))
        .rejects
        .toThrow('APNs not configured')
    })

    it('should throw error if WebPush config incomplete', async () => {
      mockDb.limit.mockResolvedValue([{
        id: 'test-app-id',
        vapidPublicKey: 'public-key',
        vapidPrivateKey: null, // Missing private key
        vapidSubject: 'mailto:test@example.com',
        slug: 'test-app',
      }])

      await expect(getProviderForApp('test-app-id', 'web'))
        .rejects
        .toThrow('Web Push not configured')
    })
  })

  describe('encryption detection', () => {
    it('should correctly identify encrypted vs unencrypted data', () => {
      const plainKey = 'plain-private-key-data'
      const encryptedKey = encryptSensitiveData(plainKey)

      expect(isDataEncrypted(plainKey)).toBe(false)
      expect(isDataEncrypted(encryptedKey)).toBe(true)

      // Decrypt and verify
      const decryptedKey = decryptSensitiveData(encryptedKey)
      expect(decryptedKey).toBe(plainKey)
    })

    it('should handle edge cases in encryption detection', () => {
      // These should not be considered encrypted
      expect(isDataEncrypted('short:string')).toBe(false)
      expect(isDataEncrypted('a:b:c')).toBe(false) // Too short hex parts
      expect(isDataEncrypted('')).toBe(false)
      expect(isDataEncrypted('no-colons-here')).toBe(false)
    })
  })

  describe('resolver encryption integration', () => {
    it('should simulate APNS resolver encryption flow', () => {
      const inputPrivateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgResolver+Test+Key
-----END PRIVATE KEY-----`

      // Simulate what the resolver does
      const encrypted = encryptSensitiveData(inputPrivateKey)

      // Verify it's encrypted
      expect(isDataEncrypted(encrypted)).toBe(true)
      expect(encrypted).not.toBe(inputPrivateKey)

      // Simulate what the provider does
      const decrypted = isDataEncrypted(encrypted)
        ? decryptSensitiveData(encrypted)
        : encrypted

      expect(decrypted).toBe(inputPrivateKey)
    })

    it('should simulate WebPush resolver encryption flow', () => {
      const inputVapidKey = 'BNTestVapidPrivateKeyForResolverIntegration'

      // Simulate what the WebPush resolver does
      const encrypted = encryptSensitiveData(inputVapidKey)

      // Verify it's encrypted
      expect(isDataEncrypted(encrypted)).toBe(true)

      // Simulate what the provider does
      const decrypted = isDataEncrypted(encrypted)
        ? decryptSensitiveData(encrypted)
        : encrypted

      expect(decrypted).toBe(inputVapidKey)
    })
  })
})
