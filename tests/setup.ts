import { randomBytes } from 'node:crypto'
import { vi } from 'vitest'

// Mock environment variables for testing
vi.stubEnv('ENCRYPTION_KEY', randomBytes(32).toString('hex'))
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
vi.stubEnv('JWT_SECRET', 'test-jwt-secret')

// Mock global functions if needed
global.fetch = vi.fn()
