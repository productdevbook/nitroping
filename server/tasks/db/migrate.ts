import { runMigrations } from '../../utils/migrate'

export default defineTask({
  meta: {
    name: 'db:migrate',
    description: 'Run database migrations',
  },
  async run() {
    const result = await runMigrations()
    return { result }
  },
})
