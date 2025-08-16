export default defineEventHandler(async (event) => {
  return {
    status: 'ok',
    service: 'nitroping',
    version: '0.0.1',
    timestamp: new Date().toISOString()
  }
})