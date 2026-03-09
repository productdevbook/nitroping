import type { ChannelType } from '#server/database/schema/enums'
import type { InferSelectModel } from 'drizzle-orm'
import * as tables from '#server/database/schema'
import { and, asc, count, eq, gt, inArray, isNotNull, or, sql } from 'drizzle-orm'

type Database = ReturnType<typeof import('#server/utils/useDatabase').useDatabase>

const DEFAULT_PAGE_SIZE = Number.parseInt(process.env.NOTIFICATION_TARGET_BATCH_SIZE || '1000')

type DeviceRow = Pick<
  InferSelectModel<typeof tables.device>,
  'id' | 'appId' | 'token' | 'platform' | 'webPushP256dh' | 'webPushAuth'
>

type ContactRow = Pick<InferSelectModel<typeof tables.contact>, 'id' | 'email' | 'phone'>

interface PushTargeting {
  appId: string
  targetDevices?: string[] | null
  platforms?: string[] | null
}

interface ChannelTargeting {
  appId: string
  channelType: Exclude<ChannelType, 'PUSH'>
  contactIds?: string[] | null
}

function toCount(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return Number.parseInt(value, 10)
  }

  return 0
}

export async function resolveActiveChannelId(
  db: Database,
  appId: string,
  type: Exclude<ChannelType, 'PUSH'>,
): Promise<string> {
  const rows = await db
    .select({ id: tables.channel.id })
    .from(tables.channel)
    .where(
      and(
        eq(tables.channel.appId, appId),
        eq(tables.channel.type, type),
        eq(tables.channel.isActive, true),
      ),
    )
    .limit(1)

  if (!rows[0]) {
    throw new Error(`No active ${type} channel configured for app ${appId}`)
  }

  return rows[0].id
}

export async function countPushTargets(db: Database, targeting: PushTargeting): Promise<number> {
  const targetDevices = targeting.targetDevices?.filter(Boolean) ?? []
  const platforms = targeting.platforms?.filter(Boolean) ?? []

  if (targetDevices.length > 0) {
    const rows = await db
      .select({ count: count() })
      .from(tables.device)
      .where(or(
        inArray(tables.device.token, targetDevices),
        inArray(tables.device.id, targetDevices),
      ))

    return toCount(rows[0]?.count)
  }

  const conditions = [eq(tables.device.appId, targeting.appId)]
  if (platforms.length > 0) {
    conditions.push(inArray(tables.device.platform, platforms as any))
  }

  const rows = await db
    .select({ count: count() })
    .from(tables.device)
    .where(and(...conditions))

  return toCount(rows[0]?.count)
}

export async function countChannelTargets(db: Database, targeting: ChannelTargeting): Promise<number> {
  if (targeting.channelType === 'DISCORD' || targeting.channelType === 'TELEGRAM') {
    return 1
  }

  const conditions = [eq(tables.contact.appId, targeting.appId)]
  const contactIds = targeting.contactIds?.filter(Boolean) ?? []

  if (contactIds.length > 0) {
    conditions.push(inArray(tables.contact.id, contactIds))
  }

  if (targeting.channelType === 'EMAIL') {
    conditions.push(isNotNull(tables.contact.email))
  }
  else if (targeting.channelType === 'SMS') {
    conditions.push(isNotNull(tables.contact.phone))
  }

  const rows = await db
    .select({ count: count() })
    .from(tables.contact)
    .where(and(...conditions))

  return toCount(rows[0]?.count)
}

export async function loadPushTargetBatch(
  db: Database,
  targeting: PushTargeting,
  afterId?: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<DeviceRow[]> {
  const targetDevices = targeting.targetDevices?.filter(Boolean) ?? []
  const platforms = targeting.platforms?.filter(Boolean) ?? []
  const conditions = []

  if (targetDevices.length > 0) {
    conditions.push(or(
      inArray(tables.device.token, targetDevices),
      inArray(tables.device.id, targetDevices),
    )!)
  }
  else {
    conditions.push(eq(tables.device.appId, targeting.appId))
  }
  if (platforms.length > 0 && targetDevices.length === 0) {
    conditions.push(inArray(tables.device.platform, platforms as any))
  }
  if (afterId) {
    conditions.push(gt(tables.device.id, afterId))
  }

  return await db
    .select({
      id: tables.device.id,
      appId: tables.device.appId,
      token: tables.device.token,
      platform: tables.device.platform,
      webPushP256dh: tables.device.webPushP256dh,
      webPushAuth: tables.device.webPushAuth,
    })
    .from(tables.device)
    .where(and(...conditions))
    .orderBy(asc(tables.device.id))
    .limit(pageSize)
}

export async function loadChannelTargetBatch(
  db: Database,
  targeting: ChannelTargeting,
  afterId?: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<ContactRow[]> {
  const contactIds = targeting.contactIds?.filter(Boolean) ?? []

  const conditions = [eq(tables.contact.appId, targeting.appId)]
  if (contactIds.length > 0) {
    conditions.push(inArray(tables.contact.id, contactIds))
  }

  if (targeting.channelType === 'EMAIL') {
    conditions.push(isNotNull(tables.contact.email))
  }
  else if (targeting.channelType === 'SMS') {
    conditions.push(isNotNull(tables.contact.phone))
  }
  if (afterId) {
    conditions.push(gt(tables.contact.id, afterId))
  }

  return await db
    .select({
      id: tables.contact.id,
      email: tables.contact.email,
      phone: tables.contact.phone,
    })
    .from(tables.contact)
    .where(and(...conditions))
    .orderBy(asc(tables.contact.id))
    .limit(pageSize)
}

export async function aggregateNotificationMetrics(db: Database, notificationId: string) {
  const rows = await db
    .select({
      sentCount: count(),
      deliveredCount: sql<number>`count(*) filter (where ${tables.deliveryLog.deliveredAt} is not null)`,
      openedCount: sql<number>`count(*) filter (where ${tables.deliveryLog.openedAt} is not null)`,
      clickedCount: sql<number>`count(*) filter (where ${tables.deliveryLog.clickedAt} is not null)`,
    })
    .from(tables.deliveryLog)
    .where(eq(tables.deliveryLog.notificationId, notificationId))

  return {
    sentCount: toCount(rows[0]?.sentCount),
    deliveredCount: toCount(rows[0]?.deliveredCount),
    openedCount: toCount(rows[0]?.openedCount),
    clickedCount: toCount(rows[0]?.clickedCount),
  }
}
