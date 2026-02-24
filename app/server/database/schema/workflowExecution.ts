import { index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { workflowExecutionStatusEnum } from './enums'
import { contact } from './contact'
import { workflow } from './workflow'

export const workflowExecution = pgTable('workflowExecution', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  workflowId: uuid().notNull().references(() => workflow.id, { onDelete: 'cascade' }),
  subscriberId: uuid().references(() => contact.id, { onDelete: 'set null' }),
  triggerIdentifier: text().notNull(),
  // Payload passed when workflow was triggered
  payload: customJsonb(),
  status: workflowExecutionStatusEnum().default('RUNNING').notNull(),
  currentStepOrder: integer().default(0).notNull(),
  errorMessage: text(),
  startedAt: customTimestamp().defaultNow().notNull(),
  completedAt: customTimestamp(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('workflowExecution_workflow_id_idx').on(table.workflowId),
  index('workflowExecution_subscriber_id_idx').on(table.subscriberId),
  index('workflowExecution_status_idx').on(table.status),
])

export const selectWorkflowExecutionSchema = createSelectSchema(workflowExecution)
export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecution)
