import type { Job } from 'bullmq'
import type { ExecuteWorkflowStepJobData, TriggerWorkflowJobData } from '../queues/workflow.queue'
import { Worker } from 'bullmq'
import { asc, eq } from 'drizzle-orm'
import { getChannelById } from '../channels'
import { getDatabase } from '../database/connection'
import * as tables from '../database/schema'
import { addExecuteWorkflowStepJob } from '../queues/workflow.queue'
import { getRedisConnection } from '../utils/redis'
import { renderTemplate } from '../utils/templateRenderer'
import { dispatchHooks } from '../utils/webhookDispatcher'

// ── helpers ─────────────────────────────────────────────────────────────────

async function failExecution(executionId: string, errorMessage: string) {
  const db = getDatabase()
  await db
    .update(tables.workflowExecution)
    .set({
      status: 'FAILED',
      errorMessage,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tables.workflowExecution.id, executionId))
}

async function completeExecution(executionId: string) {
  const db = getDatabase()
  await db
    .update(tables.workflowExecution)
    .set({
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tables.workflowExecution.id, executionId))
}

// ── job handlers ─────────────────────────────────────────────────────────────

async function processTriggerWorkflow(job: Job<TriggerWorkflowJobData>) {
  const { workflowId, executionId, appId, subscriberId, payload } = job.data
  const db = getDatabase()

  // Load ordered steps
  const steps = await db
    .select()
    .from(tables.workflowStep)
    .where(eq(tables.workflowStep.workflowId, workflowId))
    .orderBy(asc(tables.workflowStep.order))

  if (steps.length === 0) {
    await completeExecution(executionId)
    return
  }

  // Enqueue step 0
  await addExecuteWorkflowStepJob({
    workflowId,
    executionId,
    appId,
    subscriberId,
    stepOrder: 0,
    payload,
  })
}

async function processExecuteWorkflowStep(job: Job<ExecuteWorkflowStepJobData>) {
  const { workflowId, executionId, appId, subscriberId, stepOrder, payload } = job.data
  const db = getDatabase()

  // Load steps ordered
  const steps = await db
    .select()
    .from(tables.workflowStep)
    .where(eq(tables.workflowStep.workflowId, workflowId))
    .orderBy(asc(tables.workflowStep.order))

  const step = steps.find(s => s.order === stepOrder)
  if (!step) {
    // No more steps — workflow complete
    await completeExecution(executionId)
    const wf = await db.select().from(tables.workflow).where(eq(tables.workflow.id, workflowId)).limit(1)
    if (wf[0]) {
      await dispatchHooks(appId, 'WORKFLOW_COMPLETED', { executionId, workflowId })
    }
    return
  }

  // Update current step
  await db
    .update(tables.workflowExecution)
    .set({ currentStepOrder: stepOrder, updatedAt: new Date().toISOString() })
    .where(eq(tables.workflowExecution.id, executionId))

  const cfg = step.config as any || {}

  try {
    switch (step.type) {
      case 'SEND': {
        await handleSendStep(cfg, subscriberId, payload, appId)
        break
      }

      case 'DELAY': {
        const delayMs = Number(cfg.delayMs) || 0
        if (delayMs > 0) {
          // Re-queue the NEXT step with a delay — this step is "done" now
          const nextStep = steps.find(s => s.order === stepOrder + 1)
          if (nextStep) {
            await addExecuteWorkflowStepJob(
              { workflowId, executionId, appId, subscriberId, stepOrder: stepOrder + 1, payload },
              delayMs,
            )
          }
          else {
            await completeExecution(executionId)
          }
          return // Return early — next step already queued with delay
        }
        break
      }

      case 'FILTER': {
        const { field, operator, value } = cfg
        const payloadValue = String((payload as any)[field] ?? '')
        let pass = false
        switch (operator) {
          case 'eq': pass = payloadValue === String(value)
            break
          case 'neq': pass = payloadValue !== String(value)
            break
          case 'contains': pass = payloadValue.includes(String(value))
            break
          default: pass = true
        }
        if (!pass) {
          await completeExecution(executionId)
          return
        }
        break
      }

      case 'DIGEST':
      case 'BRANCH':
        // Future phases — skip for now
        break
    }

    // Enqueue next step (if any)
    const nextStep = steps.find(s => s.order === stepOrder + 1)
    if (nextStep) {
      await addExecuteWorkflowStepJob({
        workflowId,
        executionId,
        appId,
        subscriberId,
        stepOrder: stepOrder + 1,
        payload,
      })
    }
    else {
      await completeExecution(executionId)
      await dispatchHooks(appId, 'WORKFLOW_COMPLETED', { executionId, workflowId })
    }
  }
  catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    await failExecution(executionId, msg)
    await dispatchHooks(appId, 'WORKFLOW_FAILED', { executionId, workflowId, error: msg })
    throw error
  }
}

async function handleSendStep(
  cfg: any,
  subscriberId: string | undefined,
  payload: Record<string, unknown>,
  _appId: string,
) {
  const db = getDatabase()

  if (!cfg.channelId || !cfg.templateId) {
    throw new Error('SEND step missing channelId or templateId')
  }

  // Load template
  const templateRows = await db
    .select()
    .from(tables.template)
    .where(eq(tables.template.id, cfg.templateId))
    .limit(1)

  const tpl = templateRows[0]
  if (!tpl) {
    throw new Error(`Template not found: ${cfg.templateId}`)
  }

  // Resolve recipient
  let to: string = cfg.to || ''
  if (!to && subscriberId) {
    const contactRows = await db
      .select()
      .from(tables.contact)
      .where(eq(tables.contact.id, subscriberId))
      .limit(1)
    if (contactRows[0]?.email) {
      to = contactRows[0].email
    }
  }
  if (!to) {
    throw new Error('No recipient address for SEND step')
  }

  // Render template with workflow payload
  const vars = { ...payload, ...cfg.variables }
  const body = renderTemplate(tpl.body, vars)
  const subject = tpl.subject ? renderTemplate(tpl.subject, vars) : undefined
  const htmlBody = tpl.htmlBody ? renderTemplate(tpl.htmlBody, vars) : undefined

  // Get channel and send
  const ch = await getChannelById(cfg.channelId)
  await ch.send({ to, subject, body, htmlBody, data: payload })
}

// ── worker lifecycle ──────────────────────────────────────────────────────────

let worker: Worker | null = null

export function startWorkflowWorker() {
  if (worker) {
    console.log('[WorkflowWorker] Worker already running')
    return worker
  }

  worker = new Worker(
    'workflows',
    async (job) => {
      console.log(`[WorkflowWorker] Processing job ${job.id} (${job.name})`)

      if (job.name === 'trigger-workflow') {
        return processTriggerWorkflow(job as Job<TriggerWorkflowJobData>)
      }

      if (job.name === 'execute-workflow-step') {
        return processExecuteWorkflowStep(job as Job<ExecuteWorkflowStepJobData>)
      }

      console.warn(`[WorkflowWorker] Unknown job name: ${job.name}`)
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  )

  worker.on('completed', job => console.log(`[WorkflowWorker] Job ${job.id} completed`))
  worker.on('failed', (job, err) => console.error(`[WorkflowWorker] Job ${job?.id} failed:`, err.message))
  worker.on('error', err => console.error('[WorkflowWorker] Worker error:', err))

  console.log('[WorkflowWorker] Started')
  return worker
}

export async function stopWorkflowWorker() {
  if (worker) {
    await worker.close()
    worker = null
    console.log('[WorkflowWorker] Stopped')
  }
}
