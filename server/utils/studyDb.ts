import Database from 'better-sqlite3'
import { createError } from 'h3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import defaultBackup from '../../data/default-backup.json'

export type StoreName = 'vocabulary' | 'characters' | 'dialogues' | 'reviews' | 'settings'

const stores: StoreName[] = ['vocabulary', 'characters', 'dialogues', 'reviews', 'settings']
const dbPath = join(process.cwd(), 'data', 'zenstudy.sqlite')

let database: Database.Database | null = null

type Row = { id: number, data: string }

function assertStore(store: string): asserts store is StoreName {
  if (!stores.includes(store as StoreName)) throw createError({ statusCode: 400, statusMessage: `Unknown store: ${store}` })
}

function parseRow(row: Row) {
  return { ...JSON.parse(row.data), id: row.id }
}

function cleanRecord(value: Record<string, unknown>) {
  const record = { ...value }
  delete record.id
  return record
}

function getDatabase() {
  if (database) return database

  mkdirSync(dirname(dbPath), { recursive: true })
  database = new Database(dbPath)
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')

  for (const store of stores) {
    database.exec(`CREATE TABLE IF NOT EXISTS ${store} (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL)`)
  }

  seedIfEmpty(database)
  return database
}

function seedIfEmpty(db: Database.Database) {
  const hasVocabulary = db.prepare('SELECT COUNT(*) as count FROM vocabulary').get() as { count: number }
  const hasSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }
  if (hasVocabulary.count > 0 || hasSettings.count > 0) return
  resetToDefault(db)
}

function insertWithOptionalId(db: Database.Database, store: StoreName, value: Record<string, unknown>) {
  const id = typeof value.id === 'number' ? value.id : undefined
  const record = cleanRecord(value)
  const data = JSON.stringify(record)
  if (id) {
    db.prepare(`INSERT INTO ${store} (id, data) VALUES (?, ?)` ).run(id, data)
    return { ...record, id }
  }
  const result = db.prepare(`INSERT INTO ${store} (data) VALUES (?)`).run(data)
  return { ...record, id: Number(result.lastInsertRowid) }
}

function resetToDefault(db: Database.Database) {
  const backup = defaultBackup as Record<StoreName, Record<string, unknown>[]>
  const transaction = db.transaction(() => {
    for (const store of stores) db.prepare(`DELETE FROM ${store}`).run()
    for (const store of stores) {
      for (const value of backup[store] || []) insertWithOptionalId(db, store, value)
    }
  })
  transaction()
}

export function getAll(store: string) {
  assertStore(store)
  return (getDatabase().prepare(`SELECT id, data FROM ${store} ORDER BY id`).all() as Row[]).map(parseRow)
}

export function putRecord(store: string, value: Record<string, unknown>) {
  assertStore(store)
  const db = getDatabase()
  const now = new Date().toISOString()
  const payload = cleanRecord({ ...value, updatedAt: now })
  const id = typeof value.id === 'number' ? value.id : undefined

  if (id) {
    const exists = db.prepare(`SELECT id FROM ${store} WHERE id = ?`).get(id)
    if (exists) {
      db.prepare(`UPDATE ${store} SET data = ? WHERE id = ?`).run(JSON.stringify(payload), id)
      return { ...payload, id }
    }
    return insertWithOptionalId(db, store, { ...payload, id })
  }

  return insertWithOptionalId(db, store, payload)
}

export function deleteRecord(store: string, id: number) {
  assertStore(store)
  getDatabase().prepare(`DELETE FROM ${store} WHERE id = ?`).run(id)
}

export function clearStore(store: string) {
  assertStore(store)
  getDatabase().prepare(`DELETE FROM ${store}`).run()
}

export function resetDatabaseToDefault() {
  resetToDefault(getDatabase())
}

export function exportBackup() {
  return {
    app: 'ZenStudy',
    exportedAt: new Date().toISOString(),
    dbName: 'zenstudy-sqlite',
    version: 1,
    vocabulary: getAll('vocabulary'),
    characters: getAll('characters'),
    dialogues: getAll('dialogues'),
    reviews: getAll('reviews'),
    settings: getAll('settings')
  }
}

export function importBackup(data: Record<string, unknown>) {
  const db = getDatabase()
  const transaction = db.transaction(() => {
    for (const store of stores) db.prepare(`DELETE FROM ${store}`).run()
    for (const store of stores) {
      const rows = Array.isArray(data[store]) ? data[store] as Record<string, unknown>[] : []
      for (const row of rows) insertWithOptionalId(db, store, row)
    }
  })
  transaction()
}