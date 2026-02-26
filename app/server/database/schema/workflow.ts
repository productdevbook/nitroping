import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { customJsonb, customTimestamp, uuidv7Generator } from '../shared'
import { app } from './app'
import { workflowStatusEnum, workflowTriggerTypeEnum } from './enums'

export const workflow = pgTable('workflow', {
  id: uuid().primaryKey().$defaultFn(uuidv7Generator),
  appId: uuid().notNull().references(() => app.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  triggerIdentifier: text().notNull(),
  triggerType: workflowTriggerTypeEnum().default('EVENT').notNull(),
  status: workflowStatusEnum().default('DRAFT').notNull(),
  // Vue Flow layout JSON (nodes, edges)
  flowLayout: customJsonb(),
  createdAt: customTimestamp().defaultNow().notNull(),
  updatedAt: customTimestamp().defaultNow().notNull(),
}, table => [
  index('workflow_app_id_idx').on(table.appId),
  index('workflow_trigger_identifier_idx').on(table.triggerIdentifier),
  index('workflow_app_trigger_unique_idx').on(table.appId, table.triggerIdentifier),
])

export const selectWorkflowSchema = createSelectSchema(workflow)
export const insertWorkflowSchema = createInsertSchema(workflow)
