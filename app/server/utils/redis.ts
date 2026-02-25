import Redis from 'ioredis'

let redisInstance: Redis | null = null

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    })

    redisInstance.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })

    redisInstance.on('connect', () => {
      console.log('[Redis] Connected successfully')
    })
  }

  return redisInstance
}

// BullMQ Queue uses a config object (short-lived connections)
export function getRedisConnection() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }
}

// BullMQ Worker requires a dedicated ioredis instance for blocking operations
// Uses globalThis so it survives Vite HMR module reloads
declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __workerRedis: Redis | undefined
}

export function getWorkerRedis(): Redis {
  if (!globalThis.__workerRedis) {
    globalThis.__workerRedis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      retryStrategy: times => Math.min(times * 50, 2000),
    })

    globalThis.__workerRedis.on('error', (err) => {
      console.error('[WorkerRedis] Connection error:', err.message)
    })

    globalThis.__workerRedis.on('connect', () => {
      console.log('[WorkerRedis] Connected')
    })
  }

  return globalThis.__workerRedis
}

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit()
    redisInstance = null
  }
  if (globalThis.__workerRedis) {
    await globalThis.__workerRedis.quit()
    globalThis.__workerRedis = undefined
  }
}
