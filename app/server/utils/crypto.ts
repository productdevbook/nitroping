import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

// Wire format versions:
//   v1 (legacy): iv_hex:authTag_hex:encrypted_hex           – fixed 'nitroping-salt'
//   v2          : salt_hex:iv_hex:authTag_hex:encrypted_hex – random salt per call
const SALT_LENGTH = 16 // 16 bytes → 32 hex chars
const LEGACY_SALT = 'nitroping-salt'

class CryptoService {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32 // 256 bits
  private readonly ivLength = 16 // 128 bits
  private readonly tagLength = 16 // 128 bits

  private getEncryptionKey(): Buffer {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }

    if (encryptionKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes) hex string')
    }

    return Buffer.from(encryptionKey, 'hex')
  }

  private deriveKey(masterKey: Buffer, salt: Buffer | string): Buffer {
    return scryptSync(masterKey, salt, this.keyLength)
  }

  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty')
    }

    try {
      const masterKey = this.getEncryptionKey()
      const salt = randomBytes(SALT_LENGTH) // unique salt per encryption
      const key = this.deriveKey(masterKey, salt)
      const iv = randomBytes(this.ivLength)

      const cipher = createCipheriv(this.algorithm, key, iv)

      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const authTag = cipher.getAuthTag()

      // v2 format: salt:iv:authTag:encrypted
      return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    }
    catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      throw new Error('Encrypted data cannot be empty')
    }

    try {
      const parts = encryptedData.split(':')
      const masterKey = this.getEncryptionKey()

      if (parts.length === 4) {
        // v2: salt:iv:authTag:encrypted
        const [saltHex, ivHex, authTagHex, encrypted] = parts as [string, string, string, string]
        const key = this.deriveKey(masterKey, Buffer.from(saltHex, 'hex'))
        const decipher = createDecipheriv(this.algorithm, key, Buffer.from(ivHex, 'hex'))
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
      }

      if (parts.length === 3) {
        // v1 legacy: iv:authTag:encrypted (fixed salt)
        const [ivHex, authTagHex, encrypted] = parts as [string, string, string]
        const key = this.deriveKey(masterKey, LEGACY_SALT)
        const decipher = createDecipheriv(this.algorithm, key, Buffer.from(ivHex, 'hex'))
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
      }

      throw new Error('Invalid encrypted data format')
    }
    catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  isEncrypted(data: string): boolean {
    if (!data)
      return false
    const parts = data.split(':')
    const HEX32 = this.ivLength * 2 // 32 hex chars

    // v2: salt(32):iv(32):authTag(32):encrypted
    if (parts.length === 4) {
      return parts[0]!.length === HEX32
        && parts[1]!.length === HEX32
        && parts[2]!.length === HEX32
    }

    // v1 legacy: iv(32):authTag(32):encrypted
    if (parts.length === 3) {
      return parts[0]!.length === HEX32
        && parts[1]!.length === this.tagLength * 2
    }

    return false
  }

  generateKey(): string {
    return randomBytes(this.keyLength).toString('hex')
  }
}

export const cryptoService = new CryptoService()

export function encryptSensitiveData(data: string): string {
  return cryptoService.encrypt(data)
}

export function decryptSensitiveData(encryptedData: string): string {
  return cryptoService.decrypt(encryptedData)
}

export function isDataEncrypted(data: string): boolean {
  return cryptoService.isEncrypted(data)
}

export function generateEncryptionKey(): string {
  return cryptoService.generateKey()
}
