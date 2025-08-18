import type { Mock } from 'vitest'
import type { APNsConfig, APNsMessage } from '../server/providers/apns'
import type { NotificationPayload } from '../server/utils/validation'
import { Buffer } from 'node:buffer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { APNsProvider } from '../server/providers/apns'
// Mock node:http2
vi.mock('node:http2', () => ({
  connect: vi.fn(),
}))

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}))

describe('aPNsProvider', () => {
  let provider: APNsProvider
  let mockConfig: APNsConfig
  let mockHttp2Client: any
  let mockJwt: Mock

  beforeEach(async () => {
    vi.clearAllMocks()

    mockConfig = {
      keyId: 'test-key-id',
      teamId: 'test-team-id',
      bundleId: 'com.example.app',
      privateKey: 'test-private-key',
      production: false,
    }

    // Setup HTTP/2 mock
    mockHttp2Client = {
      request: vi.fn(),
      close: vi.fn(),
    }

    const mockHttp2 = vi.mocked(await import('node:http2'))
    mockHttp2.connect = vi.fn().mockReturnValue(mockHttp2Client)

    // Setup JWT mock
    const mockJwtModule = vi.mocked(await import('jsonwebtoken'))
    mockJwt = mockJwtModule.default.sign as Mock
    mockJwt.mockReturnValue('mocked-jwt-token')

    provider = new APNsProvider(mockConfig)
  })

  describe('constructor & Configuration', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeDefined()
      expect(provider).toBeInstanceOf(APNsProvider)
    })

    it('should handle production environment', () => {
      const prodConfig = { ...mockConfig, production: true }
      const prodProvider = new APNsProvider(prodConfig)
      expect(prodProvider).toBeDefined()
    })

    it('should handle development environment by default', () => {
      const devConfig = { ...mockConfig, production: undefined }
      const devProvider = new APNsProvider(devConfig)
      expect(devProvider).toBeDefined()
    })
  })

  describe('getAPNsEndpoint', () => {
    it('should return production endpoint when production is true', () => {
      const prodProvider = new APNsProvider({ ...mockConfig, production: true })
      // We need to access private method via any cast for testing
      const endpoint = (prodProvider as any).getAPNsEndpoint()
      expect(endpoint).toBe('https://api.push.apple.com')
    })

    it('should return sandbox endpoint when production is false', () => {
      const endpoint = (provider as any).getAPNsEndpoint()
      expect(endpoint).toBe('https://api.sandbox.push.apple.com')
    })
  })

  describe('jWT Token Generation', () => {
    beforeEach(() => {
      // Mock Date.now for consistent testing
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2023-01-01T00:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should generate JWT token with correct payload', async () => {
      await (provider as any).generateJWT()

      expect(mockJwt).toHaveBeenCalledWith(
        {
          iss: mockConfig.teamId,
          iat: 1672531200, // 2023-01-01T00:00:00Z in seconds
          exp: 1672534800, // 1 hour later
        },
        mockConfig.privateKey,
        {
          algorithm: 'ES256',
          header: {
            alg: 'ES256',
            kid: mockConfig.keyId,
          },
        },
      )
    })

    it('should cache JWT token for reuse', async () => {
      const token1 = await (provider as any).generateJWT()
      const token2 = await (provider as any).generateJWT()

      expect(token1).toBe(token2)
      expect(mockJwt).toHaveBeenCalledTimes(1)
    })

    it('should regenerate token when expired', async () => {
      // First call
      const token1 = await (provider as any).generateJWT()

      // Advance time by more than 1 hour
      vi.advanceTimersByTime(3600 * 1000 + 1000)

      // Second call should generate new token
      const token2 = await (provider as any).generateJWT()

      expect(mockJwt).toHaveBeenCalledTimes(2)
      expect(token1).toBe('mocked-jwt-token')
      expect(token2).toBe('mocked-jwt-token')
    })

    it('should handle JWT generation error', async () => {
      mockJwt.mockImplementation(() => {
        throw new Error('JWT signing failed')
      })

      await expect((provider as any).generateJWT()).rejects.toThrow('Failed to generate APNs JWT: Error: JWT signing failed')
    })
  })

  describe('sendMessage', () => {
    let mockRequest: any
    let testMessage: APNsMessage

    beforeEach(() => {
      mockRequest = {
        on: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        destroyed: false,
      }

      mockHttp2Client.request.mockReturnValue(mockRequest)

      testMessage = {
        token: 'test-device-token',
        payload: {
          aps: {
            alert: {
              title: 'Test Title',
              body: 'Test Body',
            },
            badge: 1,
            sound: 'default',
          },
        },
        options: {
          priority: 10,
          pushType: 'alert',
        },
      }
    })

    it('should send message successfully with 200 response', async () => {
      // Setup successful response
      mockRequest.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
        if (event === 'response') {
          callback({
            ':status': 200,
            'apns-id': 'test-message-id',
          })
        }
        if (event === 'end') {
          callback()
        }
      })

      const result = await provider.sendMessage(testMessage)

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id',
        statusCode: 200,
      })

      expect(mockHttp2Client.request).toHaveBeenCalledWith({
        ':method': 'POST',
        ':path': '/3/device/test-device-token',
        'authorization': 'bearer mocked-jwt-token',
        'apns-topic': mockConfig.bundleId,
        'content-type': 'application/json',
        'apns-priority': '10',
        'apns-push-type': 'alert',
      })
    })

    it('should handle 400 error response', async () => {
      mockRequest.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
        if (event === 'response') {
          callback({
            ':status': 400,
          })
        }
        if (event === 'data') {
          callback(Buffer.from('{"reason":"BadDeviceToken"}'))
        }
        if (event === 'end') {
          callback()
        }
      })

      const result = await provider.sendMessage(testMessage)

      expect(result).toEqual({
        success: false,
        error: 'APNs error: 400',
        statusCode: 400,
      })
    })

    it('should handle network error', async () => {
      mockRequest.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
        if (event === 'error') {
          callback(new Error('Network error'))
        }
      })

      const result = await provider.sendMessage(testMessage)

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      })
    })

    it('should include optional headers when provided', async () => {
      const messageWithOptions = {
        ...testMessage,
        options: {
          priority: 5 as const,
          expiration: 1640995200,
          collapseId: 'test-collapse-id',
          pushType: 'background' as const,
        },
      }

      mockRequest.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
        if (event === 'response') {
          callback({ ':status': 200, 'apns-id': 'test-id' })
        }
        if (event === 'end') {
          callback()
        }
      })

      await provider.sendMessage(messageWithOptions)

      expect(mockHttp2Client.request).toHaveBeenCalledWith({
        ':method': 'POST',
        ':path': '/3/device/test-device-token',
        'authorization': 'bearer mocked-jwt-token',
        'apns-topic': mockConfig.bundleId,
        'content-type': 'application/json',
        'apns-priority': '5',
        'apns-expiration': '1640995200',
        'apns-collapse-id': 'test-collapse-id',
        'apns-push-type': 'background',
      })
    })

    it('should close HTTP/2 client after request', async () => {
      mockRequest.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
        if (event === 'response') {
          callback({ ':status': 200, 'apns-id': 'test-id' })
        }
        if (event === 'end') {
          callback()
        }
      })

      await provider.sendMessage(testMessage)

      expect(mockHttp2Client.close).toHaveBeenCalled()
    })

    it('should handle invalid JSON in error response', async () => {
      mockRequest.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
        if (event === 'response') {
          // Don't resolve immediately - let it go to the end handler
          return
        }
        if (event === 'data') {
          callback(Buffer.from('invalid-json'))
        }
        if (event === 'end') {
          callback()
        }
      })

      const result = await provider.sendMessage(testMessage)

      expect(result).toEqual({
        success: false,
        error: 'Invalid APNs response',
      })
    })
  })

  describe('convertNotificationPayload', () => {
    let testPayload: NotificationPayload
    const deviceToken = 'test-device-token'
    const notificationId = 'test-notification-id'
    const deviceId = 'test-device-id'

    beforeEach(() => {
      testPayload = {
        title: 'Test Notification',
        body: 'This is a test notification',
        badge: 5,
        sound: 'notification.wav',
        clickAction: 'com.example.OPEN_MAIN',
        data: {
          customKey: 'customValue',
          userId: '12345',
        },
      }
    })

    it('should convert NotificationPayload to APNsMessage correctly', () => {
      const result = provider.convertNotificationPayload(testPayload, deviceToken)

      expect(result).toEqual({
        token: deviceToken,
        payload: {
          aps: {
            'alert': {
              title: 'Test Notification',
              body: 'This is a test notification',
            },
            'badge': 5,
            'sound': 'notification.wav',
            'category': 'com.example.OPEN_MAIN',
            'mutable-content': 1,
          },
          customKey: 'customValue',
          userId: '12345',
        },
        options: {
          priority: 10,
          pushType: 'alert',
        },
      })
    })

    it('should add tracking data when provided', () => {
      const result = provider.convertNotificationPayload(
        testPayload,
        deviceToken,
        notificationId,
        deviceId,
      )

      expect(result.payload).toMatchObject({
        nitroping_notification_id: notificationId,
        nitroping_device_id: deviceId,
        nitroping_platform: 'ios',
      })
    })

    it('should use default sound when not provided', () => {
      const payloadWithoutSound = { ...testPayload, sound: undefined }
      const result = provider.convertNotificationPayload(payloadWithoutSound, deviceToken)

      expect(result.payload.aps.sound).toBe('default')
    })

    it('should handle missing custom data', () => {
      const payloadWithoutData = { ...testPayload, data: undefined }
      const result = provider.convertNotificationPayload(payloadWithoutData, deviceToken)

      expect(result.payload.aps).toMatchObject({
        'alert': {
          title: 'Test Notification',
          body: 'This is a test notification',
        },
        'badge': 5,
        'sound': 'notification.wav',
        'category': 'com.example.OPEN_MAIN',
        'mutable-content': 1,
      })
    })
  })

  describe('sendBatchMessages', () => {
    let testMessages: APNsMessage[]

    beforeEach(() => {
      testMessages = [
        {
          token: 'token1',
          payload: { aps: { alert: 'Message 1' } },
        },
        {
          token: 'token2',
          payload: { aps: { alert: 'Message 2' } },
        },
      ]

      // Mock sendMessage to return success
      vi.spyOn(provider, 'sendMessage').mockResolvedValue({
        success: true,
        messageId: 'mock-id',
      })
    })

    it('should send all messages successfully', async () => {
      const result = await provider.sendBatchMessages(testMessages)

      expect(result).toEqual({
        success: true,
        results: [
          { success: true, messageId: 'mock-id' },
          { success: true, messageId: 'mock-id' },
        ],
        successCount: 2,
        failureCount: 0,
      })

      expect(provider.sendMessage).toHaveBeenCalledTimes(2)
    })

    it('should handle mixed success and failure', async () => {
      vi.spyOn(provider, 'sendMessage')
        .mockResolvedValueOnce({ success: true, messageId: 'success-id' })
        .mockResolvedValueOnce({ success: false, error: 'Failed to send' })

      const result = await provider.sendBatchMessages(testMessages)

      expect(result).toEqual({
        success: true,
        results: [
          { success: true, messageId: 'success-id' },
          { success: false, error: 'Failed to send' },
        ],
        successCount: 1,
        failureCount: 1,
      })
    })

    it('should handle batch size limiting', async () => {
      // Create 150 messages to test batch size of 100
      const manyMessages = Array.from({ length: 150 }, (_, i) => ({
        token: `token${i}`,
        payload: { aps: { alert: `Message ${i}` } },
      }))

      await provider.sendBatchMessages(manyMessages)

      expect(provider.sendMessage).toHaveBeenCalledTimes(150)
    })

    it('should handle batch processing error', async () => {
      vi.spyOn(provider, 'sendMessage').mockRejectedValue(new Error('Batch error'))

      const result = await provider.sendBatchMessages(testMessages)

      expect(result).toEqual({
        success: false,
        results: [
          { success: false, error: 'Batch error' },
          { success: false, error: 'Batch error' },
        ],
        successCount: 0,
        failureCount: 2,
      })
    })
  })

  describe('error Handling', () => {
    it('should handle HTTP/2 import error', async () => {
      const mockHttp2Module = await import('node:http2')
      const mockHttp2 = vi.mocked(mockHttp2Module)
      mockHttp2.connect = vi.fn().mockImplementation(() => {
        throw new Error('HTTP/2 not available')
      })

      const testMessage: APNsMessage = {
        token: 'test-token',
        payload: { aps: { alert: 'test' } },
      }

      const result = await provider.sendMessage(testMessage)

      expect(result).toEqual({
        success: false,
        error: 'HTTP/2 not available',
      })
    })

    it('should handle JWT generation failure in sendMessage', async () => {
      mockJwt.mockImplementation(() => {
        throw new Error('JWT error')
      })

      const testMessage: APNsMessage = {
        token: 'test-token',
        payload: { aps: { alert: 'test' } },
      }

      const result = await provider.sendMessage(testMessage)

      expect(result).toEqual({
        success: false,
        error: 'Failed to generate APNs JWT: Error: JWT error',
      })
    })
  })
})
