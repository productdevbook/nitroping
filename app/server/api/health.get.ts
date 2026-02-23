import { defineEventHandler } from 'nitro/h3'
export default defineEventHandler(async (_event) => {
  return {
    status: 'ok',
    service: 'nitroping',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
  }
})
