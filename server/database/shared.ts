import { timestamp } from 'drizzle-orm/pg-core'
import { v7 as uuidv7 } from 'uuid'

// Custom timestamp that returns string for GraphQL compatibility
export const customTimestamp = () => timestamp({ mode: 'string', precision: 3, withTimezone: true })

// UUID v7 generator for better performance and sortability
export const uuidv7Generator = () => uuidv7()
