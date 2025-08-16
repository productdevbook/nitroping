import { getDatabase } from '~~/server/database/connection'

export function useDatabase() {
  return getDatabase()
}
