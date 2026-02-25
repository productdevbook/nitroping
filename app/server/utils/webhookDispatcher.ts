import { createHmac } from 'node:crypto'
import { getDatabase } from '#server/database/connection'
import * as tables from '#server/database/schema'
import { decryptSensitiveData, isDataEncrypted } from '#server/utils/crypto'
import { and, eq } from 'drizzle-orm'

export type HookEvent
  = | 'NOTIFICATION_SENT'
    | 'NOTIFICATION_DELIVERED'
    | 'NOTIFICATION_FAILED'
    | 'NOTIFICATION_OPENED'
    | 'NOTIFICATION_CLICKED'
    | 'WORKFLOW_COMPLETED'
    | 'WORKFLOW_FAILED'

/**
 * Fan-out an event to all active webhooks registered for the app+event.
 * Uses Promise.allSettled so a single hook failure never blocks delivery.
 */
export async function dispatchHooks(
  appId: string,
  event: HookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const db = getDatabase()

  const hooks = await db
    .select()
    .from(tables.hook)
    .where(and(eq(tables.hook.appId, appId), eq(tables.hook.isActive, true)))

  const matchingHooks = hooks.filter((h) => {
    const events = h.events as string[] | null
    return !events || events.length === 0 || events.includes(event)
  })

  if (matchingHooks.length === 0) {
    return
  }

  const body = JSON.stringify({ event, appId, timestamp: new Date().toISOString(), payload })

  await Promise.allSettled(
    matchingHooks.map(h => deliverHook(h.url, h.secret, body)),
  )
}

async function deliverHook(url: string, secret: string | null, body: string): Promise<void> {
  let signature = ''
  if (secret) {
    const key = isDataEncrypted(secret) ? decryptSensitiveData(secret) : secret
    signature = createHmac('sha256', key).update(body).digest('hex')
  }

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(signature ? { 'X-NitroPing-Signature': `sha256=${signature}` } : {}),
    },
    body,
    // 10 s timeout via AbortController
    signal: AbortSignal.timeout(10_000),
  })
}
