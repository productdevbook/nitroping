import { jsonb, timestamp } from 'drizzle-orm/pg-core'
import { v7 as uuidv7 } from 'uuid'

// JSON type for GraphQL compatibility
export type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

// Custom jsonb that returns Json type for GraphQL compatibility
export const customJsonb = () => jsonb().$type<Json>()

// Custom timestamp that returns string for GraphQL compatibility
export const customTimestamp = () => timestamp({ mode: 'string', precision: 3, withTimezone: true })

// UUID v7 generator for better performance and sortability
export const uuidv7Generator = () => uuidv7()
