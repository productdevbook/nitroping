import { z } from 'zod'

export const platformSchema = z.enum(['ios', 'android', 'web'])

export const notificationPayloadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  data: z.record(z.any()).optional(),
  badge: z.number().int().min(0).optional(),
  sound: z.string().optional(),
  clickAction: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  targetDevices: z.array(z.string().uuid()).optional(),
  platforms: z.array(platformSchema).optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
})

export const deviceRegistrationSchema = z.object({
  token: z.string().min(1, 'Device token is required'),
  platform: platformSchema,
  appId: z.string().uuid(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const appCreateSchema = z.object({
  name: z.string().min(1, 'App name is required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  fcmServerKey: z.string().optional(),
  fcmProjectId: z.string().optional(),
  apnsCertificate: z.string().optional(),
  apnsKeyId: z.string().optional(),
  apnsTeamId: z.string().optional(),
  vapidPublicKey: z.string().optional(),
  vapidPrivateKey: z.string().optional(),
  vapidSubject: z.string().optional(),
})

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>
export type DeviceRegistration = z.infer<typeof deviceRegistrationSchema>
export type AppCreate = z.infer<typeof appCreateSchema>
