import Redis from 'ioredis'

let redisInstance: Redis | undefined

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

let workerRedis: Redis | undefined

export function getWorkerRedis(): Redis {
  if (!workerRedis) {
    workerRedis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      retryStrategy: times => Math.min(times * 50, 2000),
    })

    workerRedis.on('error', (err) => {
      console.error('[WorkerRedis] Connection error:', err.message)
    })

    workerRedis.on('connect', () => {
      console.log('[WorkerRedis] Connected')
    })
  }

  return workerRedis
}

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit()
    redisInstance = undefined
  }
  if (workerRedis) {
    await workerRedis.quit()
    workerRedis = undefined
  }
}
