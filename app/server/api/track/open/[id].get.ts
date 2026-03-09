import { Buffer } from 'node:buffer'
import { addTrackNotificationEventJob } from '#server/queues/tracking.queue'
import { defineEventHandler, getRouterParam } from 'nitro/h3'

// 1×1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  event.res.headers.set('Content-Type', 'image/gif')
  event.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  event.res.headers.set('Pragma', 'no-cache')
  event.res.headers.set('Expires', '0')

  if (!id) {
    return PIXEL
  }

  try {
    await addTrackNotificationEventJob({
      type: 'open',
      deliveryLogId: id,
    })
  }
  catch (err) {
    // Never break pixel delivery on tracking errors
    console.error('[TrackOpen] Error recording open for', id, err)
  }

  return PIXEL
})
