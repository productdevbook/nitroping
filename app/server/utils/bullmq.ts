import type { Processor, QueueOptions, WorkerOptions } from 'bullmq'
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

// Survive Nitro dev-mode HMR module reloads
declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __bullmqQueues: Map<string, Queue> | undefined
  // eslint-disable-next-line vars-on-top, no-var
  var __bullmqWorkers: Map<string, Worker> | undefined
}

const queueMap: Map<string, Queue> = (globalThis.__bullmqQueues ??= new Map())
const workerMap: Map<string, Worker> = (globalThis.__bullmqWorkers ??= new Map())

function createRedisConnection() {
  const conn = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    retryStrategy: times => Math.min(times * 50, 2000),
  })
  conn.on('error', err => console.error('[BullMQ] Redis error:', err.message))
  return conn
}

export function useQueue<T = any>(
  name: string,
  opts?: Partial<Omit<QueueOptions, 'connection'>>,
): Queue<T> {
  if (!queueMap.has(name)) {
    const queue = new Queue<T>(name, {
      ...opts,
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 1000, age: 24 * 3600 },
        removeOnFail: { count: 5000, age: 7 * 24 * 3600 },
        ...opts?.defaultJobOptions,
      },
    })
    queueMap.set(name, queue)
    console.log(`[Queue:${name}] Created`)
  }
  return queueMap.get(name) as Queue<T>
}

export function useWorker<T = any, R = any>(
  name: string,
  processor: Processor<T, R>,
  opts?: Partial<Omit<WorkerOptions, 'connection'>>,
): Worker<T, R> {
  if (!workerMap.has(name)) {
    const worker = new Worker<T, R>(name, processor, {
      concurrency: 10,
      ...opts,
      connection: createRedisConnection(),
    })

    worker.on('ready', () => console.log(`[Worker:${name}] Ready — listening for jobs`))
    worker.on('active', job => console.log(`[Worker:${name}] Job ${job.id} active`))
    worker.on('completed', job => console.log(`[Worker:${name}] Job ${job.id} completed`))
    worker.on('failed', (job, err) => console.error(`[Worker:${name}] Job ${job?.id} failed:`, err.message))
    worker.on('stalled', (jobId) => console.warn(`[Worker:${name}] Job ${jobId} stalled — was active when process died`))
    worker.on('error', err => console.error(`[Worker:${name}] Error:`, err.message))

    workerMap.set(name, worker)
    console.log(`[Worker:${name}] Started`)
  }
  return workerMap.get(name) as Worker<T, R>
}

export async function closeAllQueuesAndWorkers() {
  await Promise.all([
    ...[...queueMap.values()].map(q => q.close()),
    ...[...workerMap.values()].map(w => w.close()),
  ])
  queueMap.clear()
  workerMap.clear()
  delete globalThis.__bullmqQueues
  delete globalThis.__bullmqWorkers
}
