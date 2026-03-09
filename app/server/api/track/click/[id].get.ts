import { Buffer } from 'node:buffer'
import { addTrackNotificationEventJob } from '#server/queues/tracking.queue'
import { defineEventHandler, getQuery, getRouterParam, sendRedirect } from 'nitro/h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { url: encodedUrl } = getQuery(event)

  // Decode the original destination URL
  let destination = '/'
  if (typeof encodedUrl === 'string') {
    try {
      destination = Buffer.from(encodedUrl, 'base64url').toString('utf8')
      // Basic safety check — only allow http(s)
      const parsed = new URL(destination)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        destination = '/'
      }
    }
    catch {
      destination = '/'
    }
  }

  if (id) {
    try {
      await addTrackNotificationEventJob({
        type: 'click',
        deliveryLogId: id,
        destination,
      })
    }
    catch (err) {
      // Never block the redirect on tracking errors
      console.error('[TrackClick] Error recording click for', id, err)
    }
  }

  return sendRedirect(event, destination, 302)
})
