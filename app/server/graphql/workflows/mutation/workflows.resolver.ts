import { addTriggerWorkflowJob } from '#server/queues/workflow.queue'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const workflowMutations = defineMutation({
  createWorkflow: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const [workflow] = await db
        .insert(tables.workflow)
        .values({
          appId: input.appId as string,
          name: input.name as string,
          triggerIdentifier: input.triggerIdentifier as string,
          triggerType: (input.triggerType as any) || 'EVENT',
          status: 'DRAFT',
          flowLayout: input.flowLayout as any,
        })
        .returning()

      if (!workflow)
        throw new Error('Failed to create workflow')

      // Insert steps in a single batch if provided
      const steps = input.steps as any[] | undefined
      if (steps && steps.length > 0) {
        await db.insert(tables.workflowStep).values(
          steps.map((s: any) => ({
            workflowId: workflow.id,
            nodeId: s.nodeId,
            type: s.type,
            order: s.order,
            config: s.config,
          })),
        )
      }

      return workflow
    },
  },

  updateWorkflow: {
    resolve: async (_parent, { id, input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const updates: any = { updatedAt: new Date().toISOString() }
      if (input.name !== undefined)
        updates.name = input.name
      if (input.triggerIdentifier !== undefined)
        updates.triggerIdentifier = input.triggerIdentifier
      if (input.triggerType !== undefined)
        updates.triggerType = input.triggerType
      if (input.status !== undefined)
        updates.status = input.status
      if (input.flowLayout !== undefined)
        updates.flowLayout = input.flowLayout

      const [workflow] = await db
        .update(tables.workflow)
        .set(updates)
        .where(eq(tables.workflow.id, id as string))
        .returning()

      if (!workflow)
        throw new Error('Workflow not found')

      // Replace steps if provided
      const steps = input.steps as any[] | undefined
      if (steps !== undefined) {
        await db.delete(tables.workflowStep).where(eq(tables.workflowStep.workflowId, id as string))
        if (steps.length > 0) {
          await db.insert(tables.workflowStep).values(
            steps.map((s: any) => ({
              workflowId: id as string,
              nodeId: s.nodeId,
              type: s.type,
              order: s.order,
              config: s.config,
            })),
          )
        }
      }

      return workflow
    },
  },

  deleteWorkflow: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      await db.delete(tables.workflow).where(eq(tables.workflow.id, id as string))
      return true
    },
  },

  triggerWorkflow: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      // Load workflow
      const workflowRows = await db
        .select()
        .from(tables.workflow)
        .where(eq(tables.workflow.id, input.workflowId as string))
        .limit(1)

      const wf = workflowRows[0]
      if (!wf)
        throw new Error('Workflow not found')
      if (wf.status !== 'ACTIVE')
        throw new Error('Workflow is not active')

      // Create execution record
      const [execution] = await db
        .insert(tables.workflowExecution)
        .values({
          workflowId: wf.id,
          subscriberId: input.subscriberId as string | undefined,
          triggerIdentifier: wf.triggerIdentifier,
          payload: (input.payload as any) || {},
          status: 'RUNNING',
          currentStepOrder: 0,
        })
        .returning()

      if (!execution)
        throw new Error('Failed to create workflow execution')

      // Enqueue the trigger job
      await addTriggerWorkflowJob({
        workflowId: wf.id,
        executionId: execution.id,
        appId: wf.appId,
        subscriberId: input.subscriberId as string | undefined,
        payload: (input.payload as Record<string, unknown>) || {},
      })

      return execution
    },
  },
})
