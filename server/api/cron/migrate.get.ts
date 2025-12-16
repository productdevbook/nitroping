import type { MigrationResult } from '../../utils/migrate'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Security check - require CRON_SECRET for production
  const authHeader = getHeader(event, 'authorization')
  if (config.cronSecret && authHeader !== `Bearer ${config.cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { result } = await runTask('db:migrate') as { result: MigrationResult }

  if (!result.success) {
    throw createError({
      statusCode: 500,
      message: result.message,
    })
  }

  return { success: true, result }
})
