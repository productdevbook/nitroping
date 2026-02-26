import { Queue } from 'bullmq'
import { getRedisConnection } from '../utils/redis'

export interface TriggerWorkflowJobData {
  workflowId: string
  executionId: string
  appId: string
  subscriberId?: string
  payload: Record<string, unknown>
}

export interface ExecuteWorkflowStepJobData {
  workflowId: string
  executionId: string
  appId: string
  subscriberId?: string
  stepOrder: number
  payload: Record<string, unknown>
}

let workflowQueue: Queue | null = null

export function getWorkflowQueue() {
  if (!workflowQueue) {
    workflowQueue = new Queue('workflows', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30_000,
        },
        removeOnComplete: {
          count: 500,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 2000,
          age: 7 * 24 * 3600,
        },
      },
    })
  }
  return workflowQueue
}

export async function addTriggerWorkflowJob(data: TriggerWorkflowJobData) {
  const queue = getWorkflowQueue()
  return queue.add('trigger-workflow', data)
}

export async function addExecuteWorkflowStepJob(
  data: ExecuteWorkflowStepJobData,
  delayMs?: number,
) {
  const queue = getWorkflowQueue()
  return queue.add('execute-workflow-step', data, delayMs ? { delay: delayMs } : undefined)
}

export async function closeWorkflowQueue() {
  if (workflowQueue) {
    await workflowQueue.close()
    workflowQueue = null
  }
}
