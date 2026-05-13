export type VocabularyEntry = {
  id?: number
  word: string
  reading: string
  romaji: string
  meaning: string
  hint: string
  category: string
  tags: string[]
  level: string
  exampleJa: string
  exampleEn: string
  mastery: number
  due: number
  createdAt?: string
  updatedAt?: string
}

export type CharacterEntry = {
  id?: number
  char: string
  reading: string
  meaning: string
  level: string
  strokes: number
  hint: string
  mastery: number
  due: number
  createdAt?: string
  updatedAt?: string
}

export type DialogueLine = {
  speaker: string
  ja: string
  kana?: string
  romaji: string
  en: string
}

export type DialogueEntry = {
  id?: number
  title: string
  level: string
  setting: string
  goal: string
  lines: DialogueLine[]
  createdAt?: string
  updatedAt?: string
}

export type StudySettings = {
  id?: number
  key: 'profile'
  streak: number
  dailyGoal: number
  reviewedToday: number
  lastStudyDate: string | null
}

export const seedVocabulary: VocabularyEntry[] = []

export const seedCharacters: CharacterEntry[] = []

export const seedDialogues: DialogueEntry[] = []

export const seedSettings: StudySettings = {
  key: 'profile',
  streak: 1,
  dailyGoal: 20,
  reviewedToday: 0,
  lastStudyDate: null
}