import type { Database } from './types'
import * as tables from '#server/database/schema'
import DataLoader from 'dataloader'
import { asc, inArray } from 'drizzle-orm'

export function createWorkflowLoader(db: Database) {
  return new DataLoader<string, typeof tables.workflow.$inferSelect | null>(
    async (ids) => {
      const rows = await db
        .select()
        .from(tables.workflow)
        .where(inArray(tables.workflow.id, ids as string[]))
      return ids.map(id => rows.find(r => r.id === id) || null)
    },
  )
}

export function createStepsByWorkflowLoader(db: Database) {
  return new DataLoader<string, (typeof tables.workflowStep.$inferSelect)[]>(
    async (workflowIds) => {
      const rows = await db
        .select()
        .from(tables.workflowStep)
        .where(inArray(tables.workflowStep.workflowId, workflowIds as string[]))
        .orderBy(asc(tables.workflowStep.order))
      return workflowIds.map(id => rows.filter(r => r.workflowId === id))
    },
  )
}
