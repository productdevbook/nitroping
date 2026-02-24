import type { H3Event } from 'nitro/h3'
import { randomBytes } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { HTTPError } from 'nitro/h3'
import { getDatabase } from '../database/connection'
import { apiKey, app } from '../database/schema'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Auth] JWT_SECRET environment variable must be set in production')
  }

  console.warn('[Auth] WARNING: JWT_SECRET is not set. Using insecure default – set JWT_SECRET before deploying to production.')
}

const EFFECTIVE_JWT_SECRET = JWT_SECRET ?? 'dev-only-insecure-jwt-secret-do-not-use-in-production'

export interface JWTPayload {
  appId: string
  apiKeyId: string
  permissions: string[]
}

export function generateJWT(payload: JWTPayload, expiresIn: string = '24h'): string {
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, EFFECTIVE_JWT_SECRET) as JWTPayload
  }
  catch {
    return null
  }
}

export function generateApiKey(): string {
  // 24 random bytes → 32 base64url chars (no padding, URL-safe)
  return `np_${randomBytes(24).toString('base64url')}`
}

export async function validateApiKey(apiKeyValue: string) {
  const db = getDatabase()

  const result = await db
    .select({
      id: apiKey.id,
      appId: apiKey.appId,
      permissions: apiKey.permissions,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      appName: app.name,
      appIsActive: app.isActive,
    })
    .from(apiKey)
    .innerJoin(app, eq(apiKey.appId, app.id))
    .where(
      and(
        eq(apiKey.key, apiKeyValue),
        eq(apiKey.isActive, true),
        eq(app.isActive, true),
      ),
    )
    .limit(1)

  if (result.length === 0) {
    return null
  }

  const keyData = result[0]!

  // Check if API key is expired
  if (keyData.expiresAt && new Date() > new Date(keyData.expiresAt)) {
    return null
  }

  // Update last used timestamp
  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKey.id, keyData.id))

  return {
    id: keyData.id,
    appId: keyData.appId,
    permissions: keyData.permissions as string[] || [],
    appName: keyData.appName,
  }
}

export async function verifyApiKey(apiKeyValue: string) {
  const db = getDatabase()

  const result = await db
    .select({
      id: app.id,
      name: app.name,
      slug: app.slug,
      isActive: app.isActive,
    })
    .from(app)
    .where(eq(app.apiKey, apiKeyValue))
    .limit(1)

  if (result.length === 0 || !result[0]?.isActive) {
    return null
  }

  return result[0]
}

export async function extractAuthFromEvent(event: H3Event) {
  const authHeader = event.req.headers.get('authorization')

  if (!authHeader) {
    throw new HTTPError({
      status: 401,
      message: 'Authorization header required',
    })
  }

  if (authHeader.startsWith('Bearer ')) {
    // JWT authentication
    const token = authHeader.substring(7)
    const payload = verifyJWT(token)

    if (!payload) {
      throw new HTTPError({
        status: 401,
        message: 'Invalid or expired JWT token',
      })
    }

    return payload
  }
  else if (authHeader.startsWith('ApiKey ')) {
    // API Key authentication
    const apiKeyValue = authHeader.substring(7)
    const keyData = await validateApiKey(apiKeyValue)

    if (!keyData) {
      throw new HTTPError({
        status: 401,
        message: 'Invalid or expired API key',
      })
    }

    return {
      appId: keyData.appId,
      apiKeyId: keyData.id,
      permissions: keyData.permissions,
      appName: keyData.appName,
    }
  }
  else {
    throw new HTTPError({
      status: 401,
      message: 'Invalid authorization format. Use "Bearer <jwt>" or "ApiKey <key>"',
    })
  }
}
