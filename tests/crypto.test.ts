import { randomBytes } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  decryptSensitiveData,
  encryptSensitiveData,
  generateEncryptionKey,
  isDataEncrypted,
} from '../server/utils/crypto'

describe('crypto Service', () => {
  beforeEach(() => {
    // Ensure we have a valid encryption key for each test
    process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex')
  })

  describe('encryptSensitiveData', () => {
    it('should encrypt plain text data', () => {
      const plaintext = 'sensitive-private-key-data'
      const encrypted = encryptSensitiveData(plaintext)

      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(plaintext)
      expect(encrypted.split(':')).toHaveLength(3) // iv:authTag:encrypted
    })

    it('should produce different encrypted results for same input', () => {
      const plaintext = 'same-input'
      const encrypted1 = encryptSensitiveData(plaintext)
      const encrypted2 = encryptSensitiveData(plaintext)

      expect(encrypted1).not.toBe(encrypted2) // Different IVs
    })

    it('should throw error for empty plaintext', () => {
      expect(() => encryptSensitiveData('')).toThrow('Plaintext cannot be empty')
    })

    it('should throw error when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY
      expect(() => encryptSensitiveData('test')).toThrow('ENCRYPTION_KEY environment variable is required')
    })

    it('should throw error when ENCRYPTION_KEY is invalid length', () => {
      process.env.ENCRYPTION_KEY = 'invalid-short-key'
      expect(() => encryptSensitiveData('test')).toThrow('ENCRYPTION_KEY must be 64 characters')
    })
  })

  describe('decryptSensitiveData', () => {
    it('should decrypt encrypted data back to original', () => {
      const original = 'my-secret-apns-private-key'
      const encrypted = encryptSensitiveData(original)
      const decrypted = decryptSensitiveData(encrypted)

      expect(decrypted).toBe(original)
    })

    it('should throw error for empty encrypted data', () => {
      expect(() => decryptSensitiveData('')).toThrow('Encrypted data cannot be empty')
    })

    it('should throw error for invalid encrypted data format', () => {
      expect(() => decryptSensitiveData('invalid-format')).toThrow('Invalid encrypted data format')
      expect(() => decryptSensitiveData('only:two')).toThrow('Invalid encrypted data format')
      expect(() => decryptSensitiveData('one:two:three:four')).toThrow('Invalid encrypted data format')
    })

    it('should throw error for malformed encrypted parts', () => {
      expect(() => decryptSensitiveData('::missing-parts')).toThrow('Invalid encrypted data parts')
      expect(() => decryptSensitiveData('iv::')).toThrow('Invalid encrypted data parts')
    })

    it('should throw error when decryption fails with wrong key', () => {
      const original = 'test-data'
      const encrypted = encryptSensitiveData(original)

      // Change the encryption key
      process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex')

      expect(() => decryptSensitiveData(encrypted)).toThrow('Decryption failed')
    })

    it('should throw error for tampered encrypted data', () => {
      const original = 'test-data'
      const encrypted = encryptSensitiveData(original)
      const parts = encrypted.split(':')

      // Tamper with the encrypted part
      const tamperedEncrypted = `${parts[0]}:${parts[1]}:${parts[2]}ff`

      expect(() => decryptSensitiveData(tamperedEncrypted)).toThrow('Decryption failed')
    })
  })

  describe('isDataEncrypted', () => {
    it('should return true for encrypted data', () => {
      const encrypted = encryptSensitiveData('test-data')
      expect(isDataEncrypted(encrypted)).toBe(true)
    })

    it('should return false for plain text', () => {
      expect(isDataEncrypted('plain-text')).toBe(false)
      expect(isDataEncrypted('some-random-string')).toBe(false)
    })

    it('should return false for empty or null data', () => {
      expect(isDataEncrypted('')).toBe(false)
      expect(isDataEncrypted(' ')).toBe(false)
    })

    it('should return false for data with wrong format', () => {
      expect(isDataEncrypted('only:two:parts')).toBe(false) // Wrong hex lengths
      expect(isDataEncrypted('short:parts:here')).toBe(false)
    })

    it('should validate IV and auth tag hex lengths correctly', () => {
      // Create a properly formatted string with correct hex lengths
      const validIv = randomBytes(16).toString('hex') // 32 chars
      const validAuthTag = randomBytes(16).toString('hex') // 32 chars
      const someData = 'encrypted-data-here'
      const validFormat = `${validIv}:${validAuthTag}:${someData}`

      expect(isDataEncrypted(validFormat)).toBe(true)
    })
  })

  describe('generateEncryptionKey', () => {
    it('should generate a valid 64-character hex key', () => {
      const key = generateEncryptionKey()

      expect(key).toHaveLength(64)
      expect(key).toMatch(/^[0-9a-f]{64}$/) // Only hex characters
    })

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey()
      const key2 = generateEncryptionKey()

      expect(key1).not.toBe(key2)
    })
  })

  describe('end-to-end encryption scenarios', () => {
    it('should handle APNS private key encryption/decryption', () => {
      const apnsPrivateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgExample+Key+Data+Here
qhRANCAAQExample+Public+Key+Data+Here+For+Testing+Purposes+Only
-----END PRIVATE KEY-----`

      const encrypted = encryptSensitiveData(apnsPrivateKey)
      const decrypted = decryptSensitiveData(encrypted)

      expect(decrypted).toBe(apnsPrivateKey)
      expect(isDataEncrypted(encrypted)).toBe(true)
      expect(isDataEncrypted(apnsPrivateKey)).toBe(false)
    })

    it('should handle VAPID private key encryption/decryption', () => {
      const vapidPrivateKey = 'BNExampleVapidPrivateKeyDataHereForTestingPurposesOnly123456789'

      const encrypted = encryptSensitiveData(vapidPrivateKey)
      const decrypted = decryptSensitiveData(encrypted)

      expect(decrypted).toBe(vapidPrivateKey)
      expect(isDataEncrypted(encrypted)).toBe(true)
    })

    it('should handle multiple encryptions with same key', () => {
      const data1 = 'first-private-key'
      const data2 = 'second-private-key'

      const encrypted1 = encryptSensitiveData(data1)
      const encrypted2 = encryptSensitiveData(data2)

      expect(decryptSensitiveData(encrypted1)).toBe(data1)
      expect(decryptSensitiveData(encrypted2)).toBe(data2)
      expect(encrypted1).not.toBe(encrypted2)
    })
  })

  describe('security properties', () => {
    it('should use different IVs for each encryption', () => {
      const plaintext = 'same-data'
      const encrypted1 = encryptSensitiveData(plaintext)
      const encrypted2 = encryptSensitiveData(plaintext)

      const iv1 = encrypted1.split(':')[0]
      const iv2 = encrypted2.split(':')[0]

      expect(iv1).not.toBe(iv2)
    })

    it('should produce different auth tags for different encryptions', () => {
      const plaintext = 'same-data'
      const encrypted1 = encryptSensitiveData(plaintext)
      const encrypted2 = encryptSensitiveData(plaintext)

      const authTag1 = encrypted1.split(':')[1]
      const authTag2 = encrypted2.split(':')[1]

      expect(authTag1).not.toBe(authTag2)
    })

    it('should handle large private key data', () => {
      const largePrimaryKey = 'x'.repeat(10000) // Large data
      const encrypted = encryptSensitiveData(largePrimaryKey)
      const decrypted = decryptSensitiveData(encrypted)

      expect(decrypted).toBe(largePrimaryKey)
    })

    it('should handle special characters in private keys', () => {
      const specialChars = '!@#$%^&*()[]{}|;:,.<>?~`"\'\\/'
      const encrypted = encryptSensitiveData(specialChars)
      const decrypted = decryptSensitiveData(encrypted)

      expect(decrypted).toBe(specialChars)
    })
  })
})
