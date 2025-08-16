import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { createError, getHeader } from 'h3'
import jwt from 'jsonwebtoken'
import { getDatabase } from '../database/connection'
import { apiKey, app } from '../database/schema'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

export interface JWTPayload {
  appId: string
  apiKeyId: string
  permissions: string[]
}

export function generateJWT(payload: JWTPayload, expiresIn: string = '24h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  }
  catch {
    return null
  }
}

export async function generateApiKey(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'np_'
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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
  if (keyData.expiresAt && new Date() > keyData.expiresAt) {
    return null
  }

  // Update last used timestamp
  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
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
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authorization header required',
    })
  }

  if (authHeader.startsWith('Bearer ')) {
    // JWT authentication
    const token = authHeader.substring(7)
    const payload = verifyJWT(token)

    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired JWT token',
      })
    }

    return payload
  }
  else if (authHeader.startsWith('ApiKey ')) {
    // API Key authentication
    const apiKeyValue = authHeader.substring(7)
    const keyData = await validateApiKey(apiKeyValue)

    if (!keyData) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired API key',
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
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid authorization format. Use "Bearer <jwt>" or "ApiKey <key>"',
    })
  }
}
