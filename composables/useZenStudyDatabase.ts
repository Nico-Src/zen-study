export type CourseSummary = {
  id: string
  repositoryId: string
  repositoryName: string
  name: string
  description: string
  sourceLanguage: string
  targetLanguage: string
  version: string
  levels: string[]
  tags: string[]
  stats: {
    lessons: number
    exercises: number
    words: number
    sentences: number
    dialogues: number
    characters: number
    characterTables: number
  }
  syncStatus: 'available' | 'downloaded' | 'update-available' | 'error'
  progress: number
  updatedAt: string
}

export type CreatorDraft = {
  id: string
  title: string
  description: string
  targetLanguage: string
  sourceLanguage: string
  version: string
  lessons: number
  exercises: number
  words: string[]
  lessonData?: unknown[]
  validationIssues: string[]
  updatedAt: string
}

export type Profile = {
  id: 'profile'
  xp: number
  level: number
  streak: number
  lastStudiedAt?: string
  completedLessons?: Record<string, string[]>
  dailyGoal: number
  dailyXp: number
  badges: string[]
}

export type RepositoryRecord = {
  id: string
  url: string
  status: string
  expanded: boolean
  courses: CourseSummary[]
  updatedAt: string
}

const databaseName = 'zenstudy-local'
const databaseVersion = 1
const stores = ['courses', 'creatorDrafts', 'profile', 'repositories'] as const
type StoreName = typeof stores[number]

let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase() {
  if (!import.meta.client) return Promise.reject(new Error('IndexedDB is only available in the browser.'))
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      for (const store of stores) {
        if (!database.objectStoreNames.contains(store)) database.createObjectStore(store, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return databasePromise
}

async function readAll<T>(storeName: StoreName) {
  const database = await openDatabase()
  return await new Promise<T[]>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

async function readOne<T>(storeName: StoreName, id: string) {
  const database = await openDatabase()
  return await new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).get(id)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function writeOne<T extends { id: string }>(storeName: StoreName, value: T) {
  const database = await openDatabase()
  const payload = JSON.parse(JSON.stringify(value)) as T
  return await new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const request = transaction.objectStore(storeName).put(payload)
    request.onsuccess = () => resolve(payload)
    request.onerror = () => reject(request.error)
  })
}

async function deleteOne(storeName: StoreName, id: string) {
  const database = await openDatabase()
  return await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const request = transaction.objectStore(storeName).delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function useZenStudyDatabase() {
  const defaultProfile: Profile = {
    id: 'profile',
    xp: 2500,
    level: 12,
    streak: 12,
    dailyGoal: 60,
    dailyXp: 38,
    badges: ['First Repository', 'Hiragana Star', 'N5 Basics']
  }

  async function getProfile() {
    const profile = await readOne<Profile>('profile', 'profile')
    if (profile) return profile
    await writeOne('profile', defaultProfile)
    return defaultProfile
  }

  return {
    getCourses: () => readAll<CourseSummary>('courses'),
    saveCourse: (course: CourseSummary) => writeOne('courses', { ...course, syncStatus: 'downloaded' as const }),
    removeCourse: (id: string) => deleteOne('courses', id),
    getDrafts: () => readAll<CreatorDraft>('creatorDrafts'),
    saveDraft: (draft: CreatorDraft) => writeOne('creatorDrafts', draft),
    getRepositories: () => readAll<RepositoryRecord>('repositories'),
    saveRepository: (repository: RepositoryRecord) => writeOne('repositories', repository),
    removeRepository: (id: string) => deleteOne('repositories', id),
    getProfile,
    saveProfile: (profile: Profile) => writeOne('profile', profile)
  }
}