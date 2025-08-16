import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

interface EncryptedData {
  iv: string
  authTag: string
  encrypted: string
}

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

  private deriveKey(masterKey: Buffer, salt: string = 'nitroping-salt'): Buffer {
    return scryptSync(masterKey, salt, this.keyLength)
  }

  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty')
    }

    try {
      const masterKey = this.getEncryptionKey()
      const key = this.deriveKey(masterKey)
      const iv = randomBytes(this.ivLength)

      const cipher = createCipheriv(this.algorithm, key, iv)

      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const authTag = cipher.getAuthTag()

      const result: EncryptedData = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encrypted,
      }

      return `${result.iv}:${result.authTag}:${result.encrypted}`
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
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }

      const [ivHex, authTagHex, encrypted] = parts

      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data parts')
      }

      const masterKey = this.getEncryptionKey()
      const key = this.deriveKey(masterKey)
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')

      const decipher = createDecipheriv(this.algorithm, key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    }
    catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  isEncrypted(data: string): boolean {
    if (!data)
      return false
    const parts = data.split(':')
    return parts.length === 3
      && parts[0]?.length === this.ivLength * 2 // IV hex length
      && parts[1]?.length === this.tagLength * 2 // Auth tag hex length
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
