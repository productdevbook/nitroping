import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { and, desc, eq } from 'drizzle-orm'
import { defineQuery } from 'nitro-graphql/define'

export const workflowsQuery = defineQuery({
  workflows: {
    resolve: async (_parent, { appId, status }, _ctx) => {
      const db = useDatabase()

      const conditions = [eq(tables.workflow.appId, appId as string)]
      if (status) {
        conditions.push(eq(tables.workflow.status, status as any))
      }

      return db.select().from(tables.workflow).where(and(...conditions)).orderBy(desc(tables.workflow.createdAt))
    },
  },

  workflow: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()
      const rows = await db
        .select()
        .from(tables.workflow)
        .where(eq(tables.workflow.id, id as string))
        .limit(1)
      return rows[0] || null
    },
  },

  workflowExecutions: {
    resolve: async (_parent, { workflowId, limit, offset }, _ctx) => {
      const db = useDatabase()

      return db
        .select()
        .from(tables.workflowExecution)
        .where(eq(tables.workflowExecution.workflowId, workflowId as string))
        .orderBy(desc(tables.workflowExecution.createdAt))
        .limit(limit as number)
        .offset(offset as number)
    },
  },
})
