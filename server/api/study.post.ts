import { clearStore, deleteRecord, importBackup, putRecord, resetDatabaseToDefault } from '../utils/studyDb'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    action: 'put' | 'delete' | 'clear' | 'reset' | 'import'
    store?: string
    id?: number
    value?: Record<string, unknown>
    data?: Record<string, unknown>
  }>(event)

  if (body.action === 'put') {
    if (!body.store || !body.value) throw createError({ statusCode: 400, statusMessage: 'Missing store or value.' })
    return putRecord(body.store, body.value)
  }

  if (body.action === 'delete') {
    if (!body.store || !body.id) throw createError({ statusCode: 400, statusMessage: 'Missing store or id.' })
    deleteRecord(body.store, body.id)
    return { ok: true }
  }

  if (body.action === 'clear') {
    if (!body.store) throw createError({ statusCode: 400, statusMessage: 'Missing store.' })
    clearStore(body.store)
    return { ok: true }
  }

  if (body.action === 'reset') {
    resetDatabaseToDefault()
    return { ok: true }
  }

  if (body.action === 'import') {
    if (!body.data) throw createError({ statusCode: 400, statusMessage: 'Missing import data.' })
    importBackup(body.data)
    return { ok: true }
  }

  throw createError({ statusCode: 400, statusMessage: `Unknown action: ${body.action}` })
})