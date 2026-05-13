import { exportBackup, getAll } from '../utils/studyDb'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const store = String(query.store || '')

  if (store === 'all') return exportBackup()
  return getAll(store)
})