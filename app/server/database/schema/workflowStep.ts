import { index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { workflowStepTypeEnum } from './enums'
import { workflow } from './workflow'

export const workflowStep = pgTable('workflowStep', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  workflowId: uuid().notNull().references(() => workflow.id, { onDelete: 'cascade' }),
  // Optional: node ID from Vue Flow canvas
  nodeId: text(),
  type: workflowStepTypeEnum().notNull(),
  order: integer().notNull(),
  // Step config: channelId, templateId, delayMs, condition, etc.
  config: customJsonb(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('workflowStep_workflow_id_idx').on(table.workflowId),
  index('workflowStep_workflow_order_idx').on(table.workflowId, table.order),
])

export const selectWorkflowStepSchema = createSelectSchema(workflowStep)
export const insertWorkflowStepSchema = createInsertSchema(workflowStep)
