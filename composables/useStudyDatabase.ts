import type { CharacterEntry, DialogueEntry, StudySettings, VocabularyEntry } from '~/data/seeds'

type StoreName = 'vocabulary' | 'characters' | 'dialogues' | 'reviews' | 'settings'
type StoreMap = {
  vocabulary: VocabularyEntry
  characters: CharacterEntry
  dialogues: DialogueEntry
  reviews: Record<string, unknown>
  settings: StudySettings
}

export function useStudyDatabase() {
  const ready = ref(false)

  async function getAll<T extends StoreName>(store: T) {
    return await $fetch<StoreMap[T][]>('/api/study', { query: { store } })
  }

  async function put<T extends StoreName>(store: T, value: StoreMap[T]) {
    return await $fetch<StoreMap[T]>('/api/study', {
      method: 'POST',
      body: { action: 'put', store, value }
    })
  }

  async function remove(store: StoreName, id: number) {
    await $fetch('/api/study', {
      method: 'POST',
      body: { action: 'delete', store, id }
    })
  }

  async function clear(store: StoreName) {
    await $fetch('/api/study', {
      method: 'POST',
      body: { action: 'clear', store }
    })
  }

  async function resetToSeeds() {
    await $fetch('/api/study', {
      method: 'POST',
      body: { action: 'reset' }
    })
  }

  async function exportBackup() {
    return await $fetch<Record<string, unknown>>('/api/study', { query: { store: 'all' } })
  }

  async function importBackup(data: Record<string, unknown>) {
    await $fetch('/api/study', {
      method: 'POST',
      body: { action: 'import', data }
    })
  }

  async function init() {
    ready.value = true
  }

  return { ready, init, getAll, put, remove, clear, resetToSeeds, exportBackup, importBackup }
}