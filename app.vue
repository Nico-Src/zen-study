<script setup lang="ts">
import type { CourseSummary, CreatorDraft, Profile, RepositoryRecord } from './composables/useZenStudyDatabase'

type ViewName = 'dashboard' | 'repository' | 'map' | 'lesson' | 'characters' | 'vocabulary' | 'creator' | 'profile'
type LessonState = 'idle' | 'correct' | 'incorrect'
type ToastTone = 'success' | 'info' | 'warning'

type ToastMessage = {
  id: number
  tone: ToastTone
  message: string
}

type XpParticle = {
  id: number
  x: number
  y: number
  burstX: number
  burstY: number
  x35: number
  y35: number
  x72: number
  y72: number
  endX: number
  endY: number
  angle: number
  delay: number
  size: number
}

type XpOrigin = {
  x: number
  y: number
}

type LessonExercise = {
  id: string
  type: 'fill-blank' | 'translate' | 'choice' | 'sentence-order' | 'dialogue-order-lines' | 'dialogue-response-choice'
  prompt: string
  sentence: string
  reading?: string
  translation: string
  blankBefore?: string
  blankAfter?: string
  options: string[]
  orderItems?: string[]
  correctAnswer: string
  hint: string
  grammarTitle: string
  grammarNote: string
  example: string
  exampleReading?: string
  exampleTranslation: string
}

type VocabularyItem = {
  id: string
  term: string
  reading?: string
  meaning: string
}

type CourseLesson = {
  id: string
  title: string
  description: string
  unitTitle: string
  unitDescription: string
  locked?: boolean
  exercises: LessonExercise[]
}

type CourseContent = {
  courseId: string
  mapTitle: string
  mapDescription: string
  characterPrompt?: {
    character: string
    answers: string[]
    correctAnswer: string
  }
  characters: string[]
  vocabulary: VocabularyItem[]
  lessons: CourseLesson[]
}

type CreatorExercise = {
  id: string
  type: LessonExercise['type']
  prompt: string
  sentence: string
  reading?: string
  translation: string
  blankBefore?: string
  blankAfter?: string
  answer: string
  chips: string[]
  orderItems: string[]
  hint: string
  grammarTitle: string
  grammarNote: string
  example: string
  exampleReading?: string
  exampleTranslation: string
}

type CreatorLesson = {
  id: string
  title: string
  explanation: string
  words: string[]
  exercises: CreatorExercise[]
}

type RepositoryPayload = {
  repository?: string
  courses?: CourseSummary[]
}

type RepositorySection = {
  id: string
  url: string
  status: string
  expanded: boolean
  courses: CourseSummary[]
}

type LibraryImportPayload = RepositoryPayload | CourseSummary[] | {
  courses?: CourseSummary[]
  profile?: Profile
  drafts?: CreatorDraft[]
  repositories?: RepositoryRecord[]
}

type UnknownRecord = Record<string, unknown>

const database = useZenStudyDatabase()
const online = useOnline()
const { locale } = useI18n()

const currentView = ref<ViewName>('dashboard')
const selectedAnswer = ref('')
const orderedAnswer = ref<string[]>([])
const lessonState = ref<LessonState>('idle')
const lessonHintVisible = ref(false)
const showAlternativeReading = ref(false)
const selectedCharacterAnswer = ref('')
const characterFeedback = ref<LessonState>('idle')
const characterAdvancing = ref(false)
const characterPromptIndex = ref(0)
const randomCharacterPractice = ref(false)
const vocabularyIndex = ref(0)
const randomVocabularyPractice = ref(false)
const selectedVocabularyAnswer = ref('')
const vocabularyFeedback = ref<LessonState>('idle')
const selectedCourseId = ref('ja-foundations-a1')
const selectedLessonIndex = ref(0)
const selectedExerciseIndex = ref(0)
const repositoryUrl = ref('https://courses.example.dev/japanese')
const courses = ref<CourseSummary[]>([])
const repositorySections = ref<RepositorySection[]>([])
const repositoryStatus = ref('Example repository loaded')
const showOnlyNonAdded = ref(false)
const showJsonView = ref(false)
const showSettings = ref(false)
const uiLanguage = ref('en')
const storageLoaded = ref(false)
const toastMessages = ref<ToastMessage[]>([])
const xpParticles = ref<XpParticle[]>([])
const xpAnimationBoost = ref(0)
const xpBarPulse = ref(false)
const xpTargetRef = ref<HTMLElement | null>(null)
const lessonExplanation = ref('The 〜ば form is used to express conditionals. It translates roughly to “if” or “provided that”.')
const exercisePrompt = ref('天気が良ければ、散歩に行きます。')
const exerciseChips = ref(['ば', 'て', 'と'])
const audioAttached = ref(false)
const newWord = ref('')
const newChip = ref('')
const exerciseTypeOptions = [
  { label: 'Choice', value: 'choice' },
  { label: 'Translate', value: 'translate' },
  { label: 'Fill Blank', value: 'fill-blank' },
  { label: 'Sentence Order', value: 'sentence-order' },
  { label: 'Dialogue Line Order', value: 'dialogue-order-lines' },
  { label: 'Dialogue Response', value: 'dialogue-response-choice' }
] as const
const languageCodes = ['en', 'de', 'ja'] as const
type LanguageCode = typeof languageCodes[number]
const languageFlags: Record<LanguageCode, string> = {
  en: 'twemoji:flag-united-kingdom',
  de: 'twemoji:flag-germany',
  ja: 'twemoji:flag-japan'
}
const profile = ref<Profile>({
  id: 'profile',
  xp: 0,
  level: 1,
  streak: 0,
  dailyGoal: 60,
  dailyXp: 0,
  badges: []
})
const creatorDraft = ref<CreatorDraft>({
  id: 'draft-jlpt-n4-grammar',
  title: 'JLPT N4 Grammar Essentials',
  description: 'A repository-compatible draft for intermediate Japanese grammar patterns.',
  sourceLanguage: 'en',
  targetLanguage: 'ja',
  version: '0.1.0',
  lessons: 1,
  exercises: 1,
  words: ['食べる', '行く'],
  validationIssues: ['Exercise 1 has no native audio yet.'],
  updatedAt: new Date().toISOString()
})
const creatorDrafts = ref<CreatorDraft[]>([])

const creatorLessons = ref<CreatorLesson[]>([
  {
    id: 'lesson-conditional-ba',
    title: 'Conditional Form (〜ば)',
    explanation: 'The 〜ば form is used to express conditionals. It translates roughly to "if" or "provided that".',
    words: ['食べる', '行く'],
    exercises: [
      {
        id: 'exercise-ba-choice',
        type: 'choice',
        prompt: 'Choose the conditional ending that completes the sentence.',
        sentence: '天気が良ければ、散歩に行きます。',
        reading: 'てんきがよければ、さんぽにいきます。',
        translation: 'If the weather is good, I will go for a walk.',
        answer: 'ば',
        chips: ['ば', 'て', 'と'],
        hint: 'Use ば for conditional statements.',
        grammarTitle: 'Conditional Form',
        grammarNote: 'The ば form marks a condition that must be true for the second clause.',
        example: '時間があれば、勉強します。',
        exampleReading: 'じかんがあれば、べんきょうします。',
        exampleTranslation: 'If I have time, I will study.'
      }
    ]
  }
])
const selectedCreatorLessonId = ref('lesson-conditional-ba')

const kanaReadings: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to'
}

const uiCopy = {
  en: {
    dashboard: 'Dashboard', courses: 'Courses', courseMap: 'Course Map', characters: 'Characters', vocabulary: 'Vocabulary', creator: 'Creator',
    settings: 'Settings', online: 'Online', offlineMode: 'Offline Mode', welcomeBack: 'Welcome back,', activeCourses: 'Active Courses',
    dailyGoal: 'Daily Goal', recentAchievements: 'Recent Achievements', dayStreak: 'Day Streak', level: 'Level', xpToNext: 'XP to next level',
    repository: 'Course Repository', importJson: 'Import JSON', exportLibrary: 'Export Library', fetch: 'Fetch', addAll: 'Add all available',
    showOnlyNonAdded: 'Show only non-added', view: 'View', add: 'Add', remove: 'Remove', downloaded: 'Downloaded', available: 'Available',
    dailyXpGoal: 'Daily XP Goal', uiLanguage: 'UI Language', saveSettings: 'Save Settings', vocabularyPractice: 'Vocabulary Practice',
    randomPractice: 'Random practice', sequentialPractice: 'Sequential practice', random: 'Random', noAddedCourse: 'No Added Course',
    noVocabularyYet: 'No Vocabulary Yet', trainWordsFromCourse: 'Train words from your added course data.', practiceCharactersFromCourse: 'Practice writing-system tables from added course data.', fromLanguage: 'from'
  },
  de: {
    dashboard: 'Übersicht', courses: 'Kurse', courseMap: 'Kurskarte', characters: 'Zeichen', vocabulary: 'Vokabeln', creator: 'Editor',
    settings: 'Einstellungen', online: 'Online', offlineMode: 'Offline-Modus', welcomeBack: 'Willkommen zurück,', activeCourses: 'Aktive Kurse',
    dailyGoal: 'Tagesziel', recentAchievements: 'Erfolge', dayStreak: 'Tage-Serie', level: 'Level', xpToNext: 'XP bis zum nächsten Level',
    repository: 'Kurs-Repository', importJson: 'JSON importieren', exportLibrary: 'Bibliothek exportieren', fetch: 'Laden', addAll: 'Alle verfügbaren hinzufügen',
    showOnlyNonAdded: 'Nur nicht hinzugefügte zeigen', view: 'Ansehen', add: 'Hinzufügen', remove: 'Entfernen', downloaded: 'Heruntergeladen', available: 'Verfügbar',
    dailyXpGoal: 'Tägliches XP-Ziel', uiLanguage: 'UI-Sprache', saveSettings: 'Einstellungen speichern', vocabularyPractice: 'Vokabeltraining',
    randomPractice: 'Zufälliges Training', sequentialPractice: 'Training der Reihe nach', random: 'Zufällig', noAddedCourse: 'Kein Kurs hinzugefügt',
    noVocabularyYet: 'Noch keine Vokabeln', trainWordsFromCourse: 'Trainiere Wörter aus deinen hinzugefügten Kursdaten.', practiceCharactersFromCourse: 'Übe Zeichentabellen aus deinen hinzugefügten Kursdaten.', fromLanguage: 'aus'
  },
  ja: {
    dashboard: 'ダッシュボード', courses: 'コース', courseMap: 'コースマップ', characters: '文字', vocabulary: '語彙', creator: '作成',
    settings: '設定', online: 'オンライン', offlineMode: 'オフライン', welcomeBack: 'おかえりなさい、', activeCourses: '学習中のコース',
    dailyGoal: '今日の目標', recentAchievements: '最近の実績', dayStreak: '連続日数', level: 'レベル', xpToNext: '次のレベルまでのXP',
    repository: 'コースリポジトリ', importJson: 'JSON読み込み', exportLibrary: 'ライブラリ書き出し', fetch: '取得', addAll: '利用可能なものをすべて追加',
    showOnlyNonAdded: '未追加のみ表示', view: '表示', add: '追加', remove: '削除', downloaded: '保存済み', available: '利用可能',
    dailyXpGoal: '1日のXP目標', uiLanguage: 'UI言語', saveSettings: '設定を保存', vocabularyPractice: '語彙練習',
    randomPractice: 'ランダム練習', sequentialPractice: '順番に練習', random: 'ランダム', noAddedCourse: '追加されたコースがありません',
    noVocabularyYet: '語彙がまだありません', trainWordsFromCourse: '追加したコースデータの単語を練習します。', practiceCharactersFromCourse: '追加したコースデータの文字表を練習します。', fromLanguage: 'から'
  }
} as const

type UiLocale = keyof typeof uiCopy
type UiCopyKey = keyof typeof uiCopy.en

const languageNames: Record<UiLocale, Record<LanguageCode, string>> = {
  en: { en: 'English', de: 'German', ja: 'Japanese' },
  de: { en: 'Englisch', de: 'Deutsch', ja: 'Japanisch' },
  ja: { en: '英語', de: 'ドイツ語', ja: '日本語' }
}

function activeUiLocale() {
  return uiLanguage.value in uiCopy ? uiLanguage.value as UiLocale : 'en'
}

function t(key: UiCopyKey) {
  return uiCopy[activeUiLocale()][key] || uiCopy.en[key]
}

function normalizeLanguageCode(language: string): LanguageCode | undefined {
  const normalized = language.toLowerCase()
  if (normalized.includes('german') || normalized.includes('deutsch') || normalized === 'de') return 'de'
  if (normalized.includes('japanese') || normalized.includes('japanisch') || normalized === 'ja') return 'ja'
  if (normalized.includes('english') || normalized.includes('englisch') || normalized === 'en') return 'en'
  return undefined
}

function languageName(code: LanguageCode) {
  return languageNames[activeUiLocale()][code]
}

function languageFlagIcon(language: string) {
  const code = normalizeLanguageCode(language)
  if (code) return languageFlags[code]
  return 'twemoji:globe-showing-europe-africa'
}

function languageLabel(language: string) {
  const code = normalizeLanguageCode(language)
  return code ? languageName(code) : language
}

function selectedLanguageOption(value: unknown) {
  const code = typeof value === 'string'
    ? normalizeLanguageCode(value)
    : isRecord(value) && typeof value.value === 'string'
      ? normalizeLanguageCode(value.value)
      : undefined
  if (code) return { value: code, label: languageName(code), flag: languageFlags[code] }
  return undefined
}

const uiLanguageOptions = computed(() => languageCodes.map(value => ({ value, label: languageName(value), flag: languageFlags[value] })))
const courseLanguageOptions = computed(() => languageCodes.map(value => ({ value, label: languageName(value), flag: languageFlags[value] })))

function setUiLanguage(language: string) {
  uiLanguage.value = language
  locale.value = language
  if (import.meta.client) window.localStorage.setItem('zenstudy_ui_language', language)
}

const catalogCourses: CourseSummary[] = [
  {
    id: 'ja-foundations-a1',
    repositoryId: 'zenstudy-example-japanese',
    repositoryName: 'Example Japanese Repository',
    name: 'Japanese Foundations A1',
    description: 'Beginner Japanese with words, particles, sentences, kana tables, and simple dialogues.',
    sourceLanguage: 'English',
    targetLanguage: 'Japanese',
    version: '1.0.0',
    levels: ['A1', 'N5'],
    tags: ['beginner', 'kana', 'dialogues'],
    stats: { lessons: 42, exercises: 260, words: 450, sentences: 120, dialogues: 12, characters: 92, characterTables: 2 },
    syncStatus: 'available',
    progress: 45,
    updatedAt: '2026-05-20T00:00:00.000Z'
  },
  {
    id: 'hiragana-mastery',
    repositoryId: 'zenstudy-example-japanese',
    repositoryName: 'Example Japanese Repository',
    name: 'Hiragana Mastery',
    description: 'Focused character table drills for recognition, recall, listening, and typing.',
    sourceLanguage: 'English',
    targetLanguage: 'Japanese',
    version: '1.2.0',
    levels: ['A1'],
    tags: ['hiragana', 'writing-system'],
    stats: { lessons: 12, exercises: 96, words: 0, sentences: 20, dialogues: 0, characters: 46, characterTables: 1 },
    syncStatus: 'available',
    progress: 80,
    updatedAt: '2026-05-18T00:00:00.000Z'
  },
  {
    id: 'dialogue-cafe-travel',
    repositoryId: 'zenstudy-example-japanese',
    repositoryName: 'Example Japanese Repository',
    name: 'Cafe And Travel Dialogues',
    description: 'Short practical dialogues with sentence translation, listening prompts, and roleplay checks.',
    sourceLanguage: 'English',
    targetLanguage: 'Japanese',
    version: '0.9.4',
    levels: ['A1', 'A2'],
    tags: ['dialogues', 'travel'],
    stats: { lessons: 18, exercises: 140, words: 160, sentences: 90, dialogues: 24, characters: 0, characterTables: 0 },
    syncStatus: 'available',
    progress: 0,
    updatedAt: '2026-05-12T00:00:00.000Z'
  }
]

const courseContent: Record<string, CourseContent> = {
  'ja-foundations-a1': {
    courseId: 'ja-foundations-a1',
    mapTitle: 'Japanese Foundations A1',
    mapDescription: 'Move from greetings into particles, daily sentences, and first dialogues.',
    characters: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ'],
    characterPrompt: { character: 'き', answers: ['ka', 'ki', 'ku', 'ke'], correctAnswer: 'ki' },
    vocabulary: [
      { id: 'vocab-konnichiwa', term: 'こんにちは', reading: 'こんにちは', meaning: 'Hello' },
      { id: 'vocab-watashi', term: '私', reading: 'わたし', meaning: 'I; me' },
      { id: 'vocab-gakusei', term: '学生', reading: 'がくせい', meaning: 'student' },
      { id: 'vocab-gakkou', term: '学校', reading: 'がっこう', meaning: 'school' }
    ],
    lessons: [
      {
        id: 'foundations-greetings',
        title: 'Greetings',
        description: 'Recognize and translate everyday greetings.',
        unitTitle: 'Unit 1: First Contacts',
        unitDescription: 'Start with short sentences you can use immediately.',
        exercises: [
          {
            id: 'greeting-konnichiwa',
            type: 'translate',
            prompt: 'Choose the best translation.',
            sentence: 'こんにちは。',
            reading: 'こんにちは。',
            translation: 'Hello.',
            options: ['Hello.', 'Good night.', 'Thank you.', 'Excuse me.'],
            correctAnswer: 'Hello.',
            hint: 'This is the common daytime greeting.',
            grammarTitle: 'Greetings',
            grammarNote: 'こんにちは is used as a general hello during the day.',
            example: 'こんにちは、田中さん。',
            exampleReading: 'こんにちは、たなかさん。',
            exampleTranslation: 'Hello, Mr. Tanaka.'
          }
          ,
          {
            id: 'greeting-order',
            type: 'sentence-order',
            prompt: 'Put the greeting sentence in order.',
            sentence: 'こんにちは、田中さん。',
            reading: 'こんにちは、たなかさん。',
            translation: 'Hello, Mr. Tanaka.',
            options: ['田中さん', 'こんにちは', '、'],
            orderItems: ['こんにちは', '、', '田中さん'],
            correctAnswer: 'こんにちは 、 田中さん',
            hint: 'Start with the greeting, then name the person.',
            grammarTitle: 'Sentence Order',
            grammarNote: 'Japanese greetings can be followed directly by a name.',
            example: 'こんにちは、田中さん。',
            exampleReading: 'こんにちは、たなかさん。',
            exampleTranslation: 'Hello, Mr. Tanaka.'
          }
        ]
      },
      {
        id: 'foundations-topic-marker',
        title: 'Topic Marker は',
        description: 'Use は to mark what the sentence is about.',
        unitTitle: 'Unit 2: Daily Sentences',
        unitDescription: 'Build simple identity sentences and topic statements.',
        exercises: [
          {
            id: 'topic-marker-student',
            type: 'fill-blank',
            prompt: 'Choose the correct particle for the context.',
            sentence: '私は学生です。',
            reading: 'わたしはがくせいです。',
            blankBefore: '私',
            blankAfter: '学生です。',
            translation: 'I am a student.',
            options: ['を', 'は', 'が', 'に'],
            correctAnswer: 'は',
            hint: 'The sentence introduces what it is about: I.',
            grammarTitle: 'The Topic Marker "は"',
            grammarNote: 'The particle は marks the topic of the sentence. When used as a particle, it is pronounced "wa".',
            example: '田中さんは先生です。',
            exampleReading: 'たなかさんはせんせいです。',
            exampleTranslation: 'Mr. Tanaka is a teacher.'
          }
        ]
      },
      {
        id: 'foundations-location',
        title: 'Location に',
        description: 'Mark destinations and locations with に.',
        unitTitle: 'Unit 3: Places',
        unitDescription: 'Talk about where people go and where things are.',
        exercises: [
          {
            id: 'location-school',
            type: 'fill-blank',
            prompt: 'Choose the destination particle.',
            sentence: '学校に行きます。',
            reading: 'がっこうにいきます。',
            blankBefore: '学校',
            blankAfter: '行きます。',
            translation: 'I go to school.',
            options: ['は', 'を', 'に', 'で'],
            correctAnswer: 'に',
            hint: 'This marks the destination of 行きます.',
            grammarTitle: 'Destination Marker に',
            grammarNote: 'に can mark the destination or target of movement.',
            example: '駅に行きます。',
            exampleReading: 'えきにいきます。',
            exampleTranslation: 'I go to the station.'
          }
        ]
      }
    ]
  },
  'hiragana-mastery': {
    courseId: 'hiragana-mastery',
    mapTitle: 'Hiragana Mastery',
    mapDescription: 'Work through rows of kana with recognition and recall drills.',
    characters: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と'],
    characterPrompt: { character: 'そ', answers: ['so', 'se', 'sa', 'shi'], correctAnswer: 'so' },
    vocabulary: [
      { id: 'vocab-a', term: 'あ', reading: 'a', meaning: 'hiragana a' },
      { id: 'vocab-i', term: 'い', reading: 'i', meaning: 'hiragana i' },
      { id: 'vocab-u', term: 'う', reading: 'u', meaning: 'hiragana u' }
    ],
    lessons: [
      {
        id: 'hiragana-a-row',
        title: 'A Row',
        description: 'Read あいうえお quickly.',
        unitTitle: 'Kana Table 1',
        unitDescription: 'Recognize the core vowel row and first consonant rows.',
        exercises: [
          {
            id: 'hiragana-a',
            type: 'choice',
            prompt: 'Choose the reading for あ.',
            sentence: 'あ',
            reading: 'あ',
            translation: 'a',
            options: ['a', 'i', 'u', 'e'],
            correctAnswer: 'a',
            hint: 'あ starts the hiragana table.',
            grammarTitle: 'Hiragana Recognition',
            grammarNote: 'Read kana by sound, not by translation.',
            example: 'あめ',
            exampleReading: 'あめ',
            exampleTranslation: 'ame'
          }
        ]
      }
    ]
  },
  'dialogue-cafe-travel': {
    courseId: 'dialogue-cafe-travel',
    mapTitle: 'Cafe And Travel Dialogues',
    mapDescription: 'Practice compact travel conversations and service phrases.',
    characters: [],
    vocabulary: [
      { id: 'vocab-coffee', term: 'コーヒー', reading: 'コーヒー', meaning: 'coffee' },
      { id: 'vocab-water', term: '水', reading: 'みず', meaning: 'water' },
      { id: 'vocab-kudasai', term: 'ください', reading: 'ください', meaning: 'please give me' }
    ],
    lessons: [
      {
        id: 'dialogue-ordering',
        title: 'Ordering Coffee',
        description: 'Recognize phrases used at a cafe counter.',
        unitTitle: 'Cafe Dialogues',
        unitDescription: 'Learn short exchanges for travel and food ordering.',
        exercises: [
          {
            id: 'coffee-please',
            type: 'translate',
            prompt: 'Choose the natural translation.',
            sentence: 'コーヒーをください。',
            reading: 'コーヒーをください。',
            translation: 'Coffee, please.',
            options: ['Coffee, please.', 'Where is coffee?', 'I drank coffee.', 'Coffee is expensive.'],
            correctAnswer: 'Coffee, please.',
            hint: 'ください makes the request polite.',
            grammarTitle: 'Polite Requests',
            grammarNote: 'Noun + をください is a compact way to ask for an item.',
            example: '水をください。',
            exampleReading: 'みずをください。',
            exampleTranslation: 'Water, please.'
          }
        ]
      }
    ]
  }
}

const repositoryCourses = computed(() => repositorySections.value.flatMap(section => section.courses))
const availableCourses = computed(() => catalogCourses.map(course => {
  const remote = repositoryCourses.value.find(item => item.id === course.id) || course
  const local = courses.value.find(item => item.id === remote.id)
  return local || remote
}).concat(repositoryCourses.value
  .filter(course => !catalogCourses.some(item => item.id === course.id))
  .map(course => courses.value.find(item => item.id === course.id) || course)))
const visibleRepositoryCourses = computed(() => showOnlyNonAdded.value
  ? availableCourses.value.filter(course => course.syncStatus !== 'downloaded')
  : availableCourses.value)
const visibleRepositorySections = computed(() => repositorySections.value.map(section => ({
  ...section,
  courses: section.courses
    .map(course => courses.value.find(item => item.id === course.id) || course)
    .filter(course => !showOnlyNonAdded.value || course.syncStatus !== 'downloaded')
})))
const activeCourses = computed(() => storageLoaded.value ? courses.value : catalogCourses.slice(0, 2).map(course => ({ ...course, syncStatus: 'downloaded' as const })))
const activeCourse = computed(() => activeCourses.value.find(course => course.id === selectedCourseId.value) || activeCourses.value[0])
const activeContent = computed(() => activeCourse.value ? getCourseContent(activeCourse.value.id) : undefined)
const characterCourseOptions = computed(() => activeCourses.value.filter(course => {
  const content = getCourseContent(course.id)
  return Boolean(content?.characters.length || content?.characterPrompt)
}))
const selectedCourse = computed(() => availableCourses.value.find(course => course.id === selectedCourseId.value) || activeCourse.value || catalogCourses[0])
const selectedContent = computed(() => getCourseContent(selectedCourse.value?.id) || courseContent['ja-foundations-a1'])
const selectedLesson = computed(() => selectedContent.value.lessons[selectedLessonIndex.value] || selectedContent.value.lessons[0])
const currentExercise = computed(() => selectedLesson.value.exercises[selectedExerciseIndex.value] || selectedLesson.value.exercises[0])
const isOrderingExercise = computed(() => currentExercise.value.type === 'sentence-order' || currentExercise.value.type === 'dialogue-order-lines')
const orderingPool = computed(() => currentExercise.value.options.length ? currentExercise.value.options : currentExercise.value.orderItems || [])
const availableOrderItems = computed(() => orderingPool.value.filter((item, index) => orderedAnswer.value.filter(selected => selected === item).length < orderingPool.value.filter((candidate, candidateIndex) => candidate === item && candidateIndex <= index).length))
const lessonProgress = computed(() => Math.round(((selectedExerciseIndex.value + 1) / Math.max(selectedLesson.value.exercises.length, 1)) * 100))
const completedLessonIds = computed(() => profile.value.completedLessons?.[selectedCourse.value.id] || [])
const completedLessonSet = computed(() => new Set(completedLessonIds.value))
const courseCompletion = computed(() => Object.fromEntries(activeCourses.value.map((course) => {
  const content = getCourseContent(course.id)
  const completedCount = profile.value.completedLessons?.[course.id]?.length || 0
  const lessonCount = content?.lessons.length || course.stats.lessons || 1
  const progress = Math.max(course.progress, Math.round((completedCount / Math.max(lessonCount, 1)) * 100))
  return [course.id, { completedCount, lessonCount, progress, complete: progress >= 100 || completedCount >= lessonCount }]
})))
const runningCourses = computed(() => activeCourses.value.filter(course => !courseCompletion.value[course.id]?.complete))
const completedCourses = computed(() => activeCourses.value.filter(course => courseCompletion.value[course.id]?.complete))
const exerciseDisplaySentence = computed(() => currentExercise.value.type === 'fill-blank' && lessonState.value === 'idle' ? '' : currentExercise.value.sentence)
const dailyProgress = computed(() => Math.min(100, Math.round((profile.value.dailyXp / Math.max(profile.value.dailyGoal, 1)) * 100)))
const xpPerLevel = 500
const displayedXp = computed(() => profile.value.xp + xpAnimationBoost.value)
const profileLevel = computed(() => Math.floor(displayedXp.value / xpPerLevel) + 1)
const xpIntoLevel = computed(() => displayedXp.value % xpPerLevel)
const xpToNextLevel = computed(() => xpPerLevel - xpIntoLevel.value)
const levelProgress = computed(() => Math.round((xpIntoLevel.value / xpPerLevel) * 100))
const totalDownloaded = computed(() => courses.value.length)
const selectedCreatorLesson = computed(() => creatorLessons.value.find(lesson => lesson.id === selectedCreatorLessonId.value) || creatorLessons.value[0])
const selectedCreatorExercise = computed(() => selectedCreatorLesson.value?.exercises[0])
const draftCourseContents = computed(() => Object.fromEntries(creatorDrafts.value
  .map(draft => draft.id === creatorDraft.value.id ? buildDraftSnapshot() : draft)
  .map(draft => [draft.id, draftToCourseContent(draft)])))
const isCreatorDraftAdded = computed(() => courses.value.some(course => course.id === creatorDraft.value.id))
const characterPrompts = computed(() => {
  if (!activeContent.value) return []
  const prompts = activeContent.value.characters
    .filter(character => kanaReadings[character])
    .map(character => {
      const correctAnswer = kanaReadings[character]
      const distractors = Object.values(kanaReadings).filter(reading => reading !== correctAnswer).slice(0, 3)
      return { character, correctAnswer, answers: [correctAnswer, ...distractors].sort() }
    })

  return prompts.length
    ? prompts
    : activeContent.value.characterPrompt ? [activeContent.value.characterPrompt] : []
})
const activeCharacterPrompt = computed(() => characterPrompts.value[characterPromptIndex.value] || characterPrompts.value[0])
const vocabularyItems = computed(() => activeContent.value?.vocabulary || [])
const activeVocabularyItem = computed(() => vocabularyItems.value[vocabularyIndex.value] || vocabularyItems.value[0])
const vocabularyOptions = computed(() => {
  const correct = activeVocabularyItem.value?.meaning || ''
  const distractors = vocabularyItems.value.map(item => item.meaning).filter(meaning => meaning !== correct).slice(0, 3)
  return Array.from(new Set([correct, ...distractors])).filter(Boolean).sort()
})
const creatorSchemaCoverage = computed(() => [
  'Prompt, type, sentence, translation',
  'Alternative and example readings',
  'Fill-blank before/after text',
  'Answer options/chips and correct answer',
  'Hints, grammar notes, examples'
])
const creatorJson = computed(() => JSON.stringify({
  ...creatorDraft.value,
  lessonData: creatorLessons.value,
  audioAttached: audioAttached.value
}, null, 2))
const creatorIssues = computed(() => [
  ...(creatorDraft.value.title.trim() && creatorDraft.value.description.trim() ? [] : ['Title and description are required.']),
  ...(creatorLessons.value.length ? [] : ['At least one lesson is required.']),
  ...(creatorLessons.value.every(lesson => lesson.exercises.length) ? [] : ['Every lesson needs at least one exercise.']),
  ...(audioAttached.value ? [] : ['Exercise 1 lacks native audio pronunciation.'])
])

const navigation = [
  { key: 'dashboard', labelKey: 'dashboard', icon: 'material-symbols:dashboard' },
  { key: 'repository', labelKey: 'courses', icon: 'material-symbols:menu-book' },
  { key: 'map', labelKey: 'courseMap', icon: 'material-symbols:route' },
  { key: 'characters', labelKey: 'characters', icon: 'material-symbols:table-chart' },
  { key: 'vocabulary', labelKey: 'vocabulary', icon: 'material-symbols:style' },
  { key: 'creator', labelKey: 'creator', icon: 'material-symbols:edit-note' }
] as const

onMounted(async () => {
  if (import.meta.client) {
    setUiLanguage(window.localStorage.getItem('zenstudy_ui_language') || locale.value || 'en')
  }
  const [storedCourses, storedDrafts, storedProfile, storedRepositories] = await Promise.all([
    database.getCourses(),
    database.getDrafts(),
    database.getProfile(),
    database.getRepositories()
  ])
  courses.value = storedCourses
  if (storedDrafts[0]) {
    creatorDrafts.value = storedDrafts
    creatorDraft.value = storedDrafts[0]
    if (Array.isArray(storedDrafts[0].lessonData) && storedDrafts[0].lessonData.length) {
      creatorLessons.value = storedDrafts[0].lessonData as CreatorLesson[]
      selectedCreatorLessonId.value = creatorLessons.value[0].id
    }
  }
  else {
    creatorDrafts.value = [creatorDraft.value]
  }
  profile.value = storedProfile
  repositorySections.value = dedupeRepositorySections([
    ...storedRepositories.map(repositoryRecordToSection),
    buildExampleRepositorySection()
  ])
  repositoryUrl.value = repositorySections.value[0]?.url || repositoryUrl.value
  updateRepositoryStatus()
  await saveRepositorySections()
  selectedCourseId.value = storedCourses[0]?.id || ''
  storageLoaded.value = true
})

function switchView(view: ViewName) {
  if (view === 'characters' && characterCourseOptions.value.length && !characterCourseOptions.value.some(course => course.id === selectedCourseId.value)) {
    selectPracticeCourse(characterCourseOptions.value[0].id)
  }
  currentView.value = view
  selectedAnswer.value = ''
  orderedAnswer.value = []
  lessonState.value = 'idle'
  lessonHintVisible.value = false
  showAlternativeReading.value = false
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function nextStreak(lastStudiedAt?: string) {
  const today = dateKey(new Date())
  if (lastStudiedAt === today) return profile.value.streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return lastStudiedAt === dateKey(yesterday) ? profile.value.streak + 1 : 1
}

function showToast(message: string, tone: ToastTone = 'info') {
  const toast = { id: Date.now(), tone, message }
  toastMessages.value = [...toastMessages.value, toast]
  window.setTimeout(() => {
    toastMessages.value = toastMessages.value.filter(item => item.id !== toast.id)
  }, 3200)
}

let xpParticleId = 0

function xpTargetPoint() {
  const rect = xpTargetRef.value?.getBoundingClientRect()
  if (rect) return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 }
  return { x: 144, y: window.innerHeight - 132 }
}

function xpOriginFromEvent(event?: MouseEvent): XpOrigin | undefined {
  const element = event?.currentTarget instanceof HTMLElement ? event.currentTarget : undefined
  const rect = element?.getBoundingClientRect()
  if (!rect) return undefined
  return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 }
}

function pulseXpBar() {
  xpBarPulse.value = false
  window.requestAnimationFrame(() => {
    xpBarPulse.value = true
    window.setTimeout(() => {
      xpBarPulse.value = false
    }, 180)
  })
}

function launchXpParticles(amount: number, origin?: XpOrigin) {
  const target = xpTargetPoint()
  const startBaseX = origin?.x ?? Math.min(window.innerWidth * 0.62, window.innerWidth - 180)
  const startBaseY = origin?.y ?? Math.min(window.innerHeight * 0.55, window.innerHeight - 160)
  const motes = Array.from({ length: amount }, (_, index) => {
    const x = startBaseX + (Math.random() - 0.5) * 18
    const y = startBaseY + (Math.random() - 0.5) * 18
    const delay = index * 22 + Math.random() * 110
    const dx = target.x - x
    const dy = target.y - y
    const distance = Math.max(Math.hypot(dx, dy), 1)
    const normalX = -dy / distance
    const normalY = dx / distance
    const burstDistance = 10 + Math.random() * 26
    const burstSide = (Math.random() - 0.5) * 2
    const burstForward = 0.03 + Math.random() * 0.04
    const drift = (Math.random() - 0.5) * 14
    const settleDrift = (Math.random() - 0.5) * 6
    return {
      id: ++xpParticleId,
      x,
      y,
      burstX: x + dx * burstForward + normalX * burstDistance * burstSide,
      burstY: y + dy * burstForward + normalY * burstDistance * burstSide,
      x35: x + dx * 0.35 + normalX * drift,
      y35: y + dy * 0.35 + normalY * drift,
      x72: x + dx * 0.72 + normalX * settleDrift,
      y72: y + dy * 0.72 + normalY * settleDrift,
      endX: target.x,
      endY: target.y,
      angle: Math.atan2(dy, dx) * 180 / Math.PI,
      delay,
      size: 0.48 + Math.random() * 0.28
    }
  })

  xpParticles.value = [...xpParticles.value, ...motes]
  motes.forEach((particle) => {
    window.setTimeout(() => {
      xpAnimationBoost.value += 1
      pulseXpBar()
      xpParticles.value = xpParticles.value.filter(item => item.id !== particle.id)
    }, particle.delay + 850)
  })
  const finalImpact = Math.max(...motes.map(particle => particle.delay), 0) + 900
  return new Promise(resolve => window.setTimeout(resolve, finalImpact))
}

async function saveXpGain(amount: number, label: string, patch: Partial<Profile> = {}, origin?: XpOrigin) {
  await launchXpParticles(amount, origin)
  const nextXp = profile.value.xp + amount
  profile.value = await database.saveProfile({
    ...profile.value,
    ...patch,
    xp: nextXp,
    level: Math.floor(nextXp / xpPerLevel) + 1,
    streak: nextStreak(profile.value.lastStudiedAt),
    lastStudiedAt: dateKey(new Date()),
    dailyXp: Math.min(profile.value.dailyGoal, profile.value.dailyXp + amount)
  })
  xpAnimationBoost.value = Math.max(0, xpAnimationBoost.value - amount)
  showToast(`+${amount} XP ${label}`, 'success')
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function normalizeImportedCourses(payload: unknown) {
  if (Array.isArray(payload)) return payload
  if (!isRecord(payload)) return []
  if (Array.isArray(payload.courses)) return payload.courses as CourseSummary[]
  if (typeof payload.id === 'string') return [payload as CourseSummary]
  return []
}

function getCourseContent(courseId?: string) {
  if (!courseId) return undefined
  return draftCourseContents.value[courseId] || courseContent[courseId]
}

function normalizeCreatorExercise(value: unknown, index: number): CreatorExercise {
  const exercise = isRecord(value) ? value as Partial<CreatorExercise> : {}
  const answer = typeof exercise.answer === 'string' ? exercise.answer : 'answer'
  return {
    id: typeof exercise.id === 'string' ? exercise.id : `exercise-${Date.now()}-${index}`,
    type: exercise.type === 'fill-blank' || exercise.type === 'translate' || exercise.type === 'choice' || exercise.type === 'sentence-order' || exercise.type === 'dialogue-order-lines' || exercise.type === 'dialogue-response-choice' ? exercise.type : 'choice',
    prompt: typeof exercise.prompt === 'string' ? exercise.prompt : 'Choose the correct answer.',
    sentence: typeof exercise.sentence === 'string' ? exercise.sentence : '例文を入力します。',
    reading: typeof exercise.reading === 'string' ? exercise.reading : '',
    translation: typeof exercise.translation === 'string' ? exercise.translation : '',
    blankBefore: typeof exercise.blankBefore === 'string' ? exercise.blankBefore : '',
    blankAfter: typeof exercise.blankAfter === 'string' ? exercise.blankAfter : '',
    answer,
    chips: Array.isArray(exercise.chips) && exercise.chips.length ? Array.from(new Set(exercise.chips.map(String))) : [answer],
    orderItems: Array.isArray(exercise.orderItems) && exercise.orderItems.length ? exercise.orderItems.map(String) : Array.isArray(exercise.chips) ? exercise.chips.map(String) : [answer],
    hint: typeof exercise.hint === 'string' ? exercise.hint : 'Add a helpful hint for learners.',
    grammarTitle: typeof exercise.grammarTitle === 'string' ? exercise.grammarTitle : 'Grammar Note',
    grammarNote: typeof exercise.grammarNote === 'string' ? exercise.grammarNote : 'Explain the grammar or usage behind this exercise.',
    example: typeof exercise.example === 'string' ? exercise.example : '例文です。',
    exampleReading: typeof exercise.exampleReading === 'string' ? exercise.exampleReading : '',
    exampleTranslation: typeof exercise.exampleTranslation === 'string' ? exercise.exampleTranslation : ''
  }
}

function normalizeCreatorLessons(data: unknown, words: string[] = []) {
  const lessons = Array.isArray(data) ? data : []
  return lessons.length
    ? lessons.map((value, index) => {
        const lesson = isRecord(value) ? value as Partial<CreatorLesson> : {}
        return {
          id: typeof lesson.id === 'string' ? lesson.id : `lesson-${Date.now()}-${index}`,
          title: typeof lesson.title === 'string' ? lesson.title : `Lesson ${index + 1}`,
          explanation: typeof lesson.explanation === 'string' ? lesson.explanation : 'Write the lesson explanation here.',
          words: Array.isArray(lesson.words) ? lesson.words.map(String) : words,
          exercises: Array.isArray(lesson.exercises) && lesson.exercises.length ? lesson.exercises.map(normalizeCreatorExercise) : [createCreatorExercise()]
        }
      })
    : [{ id: `lesson-${Date.now()}`, title: 'Lesson 1', explanation: 'Write the lesson explanation here.', words, exercises: [createCreatorExercise('Choose the correct answer.')] }]
}

function draftToCourseContent(draft: CreatorDraft): CourseContent {
  const lessons = normalizeCreatorLessons(draft.lessonData, draft.words)
  return {
    courseId: draft.id,
    mapTitle: draft.title,
    mapDescription: draft.description,
    characters: [],
    vocabulary: Array.from(new Set(lessons.flatMap(lesson => lesson.words))).map(word => ({ id: `vocab-${word}`, term: word, reading: '', meaning: word })),
    lessons: lessons.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.explanation,
      unitTitle: `Unit ${index + 1}`,
      unitDescription: lesson.explanation,
      exercises: lesson.exercises.map((exercise): LessonExercise => ({
        id: exercise.id,
        type: exercise.type,
        prompt: exercise.prompt,
        sentence: exercise.sentence,
        reading: exercise.reading,
        translation: exercise.translation,
        blankBefore: exercise.blankBefore,
        blankAfter: exercise.blankAfter,
        options: (exercise.type === 'sentence-order' || exercise.type === 'dialogue-order-lines')
          ? Array.from(new Set(exercise.chips.length ? exercise.chips : exercise.orderItems)).filter(Boolean)
          : Array.from(new Set([...exercise.chips, exercise.answer])).filter(Boolean),
        orderItems: exercise.orderItems,
        correctAnswer: exercise.answer,
        hint: exercise.hint,
        grammarTitle: exercise.grammarTitle,
        grammarNote: exercise.grammarNote,
        example: exercise.example,
        exampleReading: exercise.exampleReading,
        exampleTranslation: exercise.exampleTranslation
      }))
    }))
  }
}

function draftToCourseSummary(draft: CreatorDraft): CourseSummary {
  const lessons = normalizeCreatorLessons(draft.lessonData, draft.words)
  const exercises = lessons.flatMap(lesson => lesson.exercises)
  const words = Array.from(new Set(lessons.flatMap(lesson => lesson.words)))
  return {
    id: draft.id,
    repositoryId: 'creator-drafts',
    repositoryName: 'Creator Drafts',
    name: draft.title,
    description: draft.description,
    sourceLanguage: draft.sourceLanguage,
    targetLanguage: draft.targetLanguage,
    version: draft.version,
    levels: ['Draft'],
    tags: ['draft', 'local-test'],
    stats: {
      lessons: lessons.length,
      exercises: exercises.length,
      words: words.length,
      sentences: exercises.length,
      dialogues: 0,
      characters: 0,
      characterTables: 0
    },
    syncStatus: 'available',
    progress: 0,
    updatedAt: draft.updatedAt
  }
}

function repositorySectionId(url: string) {
  return `repo-${normalizeRepositoryUrl(url).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now()}`
}

function normalizeRepositoryUrl(url: string) {
  const trimmedUrl = url.trim().replace(/\/+$/, '')
  try {
    const parsedUrl = new URL(trimmedUrl)
    parsedUrl.hash = ''
    parsedUrl.protocol = parsedUrl.protocol.toLowerCase()
    parsedUrl.hostname = parsedUrl.hostname.toLowerCase()
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '')
    return parsedUrl.toString().replace(/\/+$/, '').toLowerCase()
  }
  catch {
    return trimmedUrl.toLowerCase()
  }
}

function buildExampleRepositorySection(): RepositorySection {
  return {
    id: repositorySectionId(repositoryUrl.value),
    url: repositoryUrl.value,
    status: `${catalogCourses.length} courses loaded from bundled example repository`,
    expanded: true,
    courses: catalogCourses.map(course => ({ ...course, syncStatus: 'available' as const }))
  }
}

function repositoryRecordToSection(record: RepositoryRecord): RepositorySection {
  const isExampleRepository = normalizeRepositoryUrl(record.url) === normalizeRepositoryUrl(repositoryUrl.value)
  return {
    id: repositorySectionId(record.url),
    url: record.url.trim(),
    status: record.status || (isExampleRepository ? `${catalogCourses.length} courses loaded from bundled example repository` : 'Repository saved locally'),
    expanded: record.expanded,
    courses: record.courses?.length
      ? record.courses.map(course => ({ ...course, syncStatus: 'available' as const }))
      : isExampleRepository
        ? catalogCourses.map(course => ({ ...course, syncStatus: 'available' as const }))
        : []
  }
}

function dedupeRepositorySections(sections: RepositorySection[]) {
  const uniqueSections = new Map<string, RepositorySection>()
  for (const section of sections) {
    const normalizedUrl = normalizeRepositoryUrl(section.url)
    if (!normalizedUrl || uniqueSections.has(normalizedUrl)) continue
    uniqueSections.set(normalizedUrl, {
      ...section,
      id: repositorySectionId(section.url),
      url: section.url.trim()
    })
  }
  return Array.from(uniqueSections.values())
}

function updateRepositoryStatus() {
  repositoryStatus.value = `${repositorySections.value.length} repository ${repositorySections.value.length === 1 ? 'URL' : 'URLs'} configured`
}

async function saveRepositorySections() {
  const savedIds = new Set<string>()
  for (const section of repositorySections.value) {
    savedIds.add(section.id)
    await database.saveRepository({
      ...section,
      updatedAt: new Date().toISOString()
    })
  }
  for (const stored of await database.getRepositories()) {
    if (!savedIds.has(stored.id)) await database.removeRepository(stored.id)
  }
}

async function upsertRepositorySection(url: string, nextCourses: CourseSummary[], status: string) {
  const trimmedUrl = url.trim().replace(/\/+$/, '')
  const id = repositorySectionId(trimmedUrl)
  const section: RepositorySection = {
    id,
    url: trimmedUrl,
    status,
    expanded: true,
    courses: nextCourses.map(course => ({ ...course, syncStatus: 'available' as const }))
  }
  repositorySections.value = dedupeRepositorySections([
    section,
    ...repositorySections.value.filter(item => normalizeRepositoryUrl(item.url) !== normalizeRepositoryUrl(trimmedUrl))
  ])
  repositoryUrl.value = trimmedUrl
  updateRepositoryStatus()
  await saveRepositorySections()
}

async function toggleRepositorySection(id: string) {
  repositorySections.value = repositorySections.value.map(section => section.id === id ? { ...section, expanded: !section.expanded } : section)
  await saveRepositorySections()
}

async function fetchRepository(url = repositoryUrl.value) {
  const trimmedUrl = url.trim()
  if (!trimmedUrl) {
    showToast('Enter a repository URL first.', 'warning')
    return
  }
  repositoryStatus.value = `Fetching ${trimmedUrl}...`
  try {
    if (trimmedUrl.includes('example.dev')) {
      const status = `${catalogCourses.length} courses loaded from bundled example repository`
      await upsertRepositorySection(trimmedUrl, catalogCourses, status)
      showToast(status, 'success')
      return
    }

    const endpoint = trimmedUrl.includes('example.dev') ? '/api/courses' : trimmedUrl
    const payload = await $fetch<RepositoryPayload | CourseSummary[]>(endpoint)
    const nextCourses = normalizeImportedCourses(payload)
    if (!nextCourses.length) throw new Error('No courses were found in this repository.')
    const status = `${nextCourses.length} courses loaded from repository`
    await upsertRepositorySection(trimmedUrl, nextCourses, status)
    showToast(status, 'success')
  }
  catch (error) {
    const message = error instanceof Error ? error.message : ''
    const status = message && !message.includes('Cannot use') && message.length < 120
      ? message
      : 'Repository did not return a ZenStudy course manifest.'
    repositoryStatus.value = status
    const id = repositorySectionId(trimmedUrl)
    repositorySections.value = repositorySections.value.map(section => section.id === id ? { ...section, status } : section)
    await saveRepositorySections()
    showToast(status, 'warning')
  }
}

async function addCourse(course: CourseSummary) {
  const savedCourse = await database.saveCourse({ ...course, progress: course.progress || 0 })
  courses.value = [...courses.value.filter(item => item.id !== savedCourse.id), savedCourse]
  if (!selectedCourseId.value) selectedCourseId.value = savedCourse.id
  profile.value = await database.saveProfile({
    ...profile.value,
    badges: Array.from(new Set([...profile.value.badges, 'First Repository']))
  })
  showToast(`${course.name} saved to IndexedDB`, 'success')
}

function openCourse(course: CourseSummary, view: ViewName = 'map') {
  selectedCourseId.value = course.id
  const content = getCourseContent(course.id)
  selectedLessonIndex.value = Math.min(selectedLessonIndex.value, Math.max((content?.lessons.length || 1) - 1, 0))
  selectedExerciseIndex.value = 0
  characterPromptIndex.value = 0
  selectedCharacterAnswer.value = ''
  characterFeedback.value = 'idle'
  characterAdvancing.value = false
  switchView(view)
}

function selectPracticeCourse(id: string) {
  selectedCourseId.value = id
  selectedLessonIndex.value = 0
  selectedExerciseIndex.value = 0
  vocabularyIndex.value = 0
  selectedVocabularyAnswer.value = ''
  vocabularyFeedback.value = 'idle'
  characterPromptIndex.value = 0
  selectedCharacterAnswer.value = ''
  characterFeedback.value = 'idle'
  characterAdvancing.value = false
}

function buildDraftSnapshot() {
  return {
    ...creatorDraft.value,
    lessons: creatorLessons.value.length,
    exercises: creatorLessons.value.reduce((total, lesson) => total + lesson.exercises.length, 0),
    words: Array.from(new Set(creatorLessons.value.flatMap(lesson => lesson.words))),
    lessonData: creatorLessons.value,
    validationIssues: creatorIssues.value,
    updatedAt: new Date().toISOString()
  }
}

function loadCreatorDraft(draft: CreatorDraft) {
  creatorDraft.value = draft
  creatorLessons.value = normalizeCreatorLessons(draft.lessonData, draft.words || [])
  selectedCreatorLessonId.value = creatorLessons.value[0].id
}

function selectCreatorDraft(id: string) {
  creatorDrafts.value = creatorDrafts.value.map(draft => draft.id === creatorDraft.value.id ? buildDraftSnapshot() : draft)
  const draft = creatorDrafts.value.find(item => item.id === id)
  if (draft) loadCreatorDraft(draft)
}

function createCreatorDraft() {
  const nextNumber = creatorDrafts.value.length + 1
  const draft: CreatorDraft = {
    id: `draft-course-${Date.now()}`,
    title: `New Course ${nextNumber}`,
    description: 'Describe what learners will practice in this course.',
    sourceLanguage: 'en',
    targetLanguage: 'ja',
    version: '0.1.0',
    lessons: 1,
    exercises: 1,
    words: [],
    lessonData: [{ id: `lesson-${Date.now()}`, title: 'Lesson 1', explanation: 'Write the lesson explanation here.', words: [], exercises: [createCreatorExercise('Choose the correct answer.')] }],
    validationIssues: [],
    updatedAt: new Date().toISOString()
  }
  creatorDrafts.value = [...creatorDrafts.value.map(item => item.id === creatorDraft.value.id ? buildDraftSnapshot() : item), draft]
  loadCreatorDraft(draft)
}

function startLesson(index: number) {
  if (!activeContent.value) {
    showToast('Add a course before starting lessons.', 'warning')
    switchView('repository')
    return
  }
  selectedLessonIndex.value = index
  selectedExerciseIndex.value = 0
  selectedAnswer.value = ''
  orderedAnswer.value = []
  lessonState.value = 'idle'
  lessonHintVisible.value = false
  showAlternativeReading.value = false
  switchView('lesson')
}

async function addAllCourses() {
  for (const course of availableCourses.value) await addCourse(course)
}

async function removeCourse(id: string) {
  await database.removeCourse(id)
  courses.value = courses.value.filter(course => course.id !== id)
  if (selectedCourseId.value === id) selectPracticeCourse(courses.value[0]?.id || '')
  showToast('Course removed from local library', 'info')
}

function exportLibrary() {
  downloadJson('zenstudy-library.json', {
    exportedAt: new Date().toISOString(),
    profile: profile.value,
    courses: courses.value,
    repositories: repositorySections.value.map(section => ({
      ...section,
      updatedAt: new Date().toISOString()
    })),
    drafts: [creatorDraft.value]
  })
  showToast('Library JSON exported', 'success')
}

async function importLibrary(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const payload = JSON.parse(await file.text()) as LibraryImportPayload
    const importedCourses = normalizeImportedCourses(payload)
    for (const course of importedCourses) await addCourse(course)
    if (isRecord(payload) && 'profile' in payload && payload.profile) profile.value = await database.saveProfile(payload.profile as Profile)
    if (isRecord(payload) && 'drafts' in payload && Array.isArray(payload.drafts) && payload.drafts[0]) creatorDraft.value = await database.saveDraft(payload.drafts[0] as CreatorDraft)
    if (isRecord(payload) && 'repositories' in payload && Array.isArray(payload.repositories)) {
      repositorySections.value = dedupeRepositorySections([
        ...payload.repositories.map(repositoryRecord => repositoryRecordToSection(repositoryRecord as RepositoryRecord)),
        ...repositorySections.value
      ])
      updateRepositoryStatus()
      await saveRepositorySections()
    }
    showToast(`Imported ${importedCourses.length} courses`, 'success')
  }
  catch {
    showToast('Import failed. Please choose a ZenStudy JSON file.', 'warning')
  }
  input.value = ''
}

async function saveDraft() {
  const updatedDraft = buildDraftSnapshot()
  await database.saveDraft(updatedDraft)
  creatorDraft.value = updatedDraft
  creatorDrafts.value = [...creatorDrafts.value.filter(draft => draft.id !== updatedDraft.id), updatedDraft]
  showToast('Draft saved locally', 'success')
}

async function addCreatorDraftToCourses() {
  const wasAdded = isCreatorDraftAdded.value
  const updatedDraft = buildDraftSnapshot()
  await database.saveDraft(updatedDraft)
  creatorDraft.value = updatedDraft
  creatorDrafts.value = [...creatorDrafts.value.filter(draft => draft.id !== updatedDraft.id), updatedDraft]

  const playableCourse = draftToCourseSummary(updatedDraft)
  await database.removeCourse(playableCourse.id)
  const savedCourse = await database.saveCourse(playableCourse)
  courses.value = [...courses.value.filter(course => course.id !== savedCourse.id), savedCourse]
  selectPracticeCourse(savedCourse.id)
  showToast(`${savedCourse.name} ${wasAdded ? 'updated' : 'added'} in My Courses`, 'success')
}

function exportCourse() {
  downloadJson(`${creatorDraft.value.id}.json`, JSON.parse(creatorJson.value))
  showToast('Course JSON exported', 'success')
}

async function importCourseDraft(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const payload = JSON.parse(await file.text()) as CreatorDraft & {
      audioAttached?: boolean
    }
    creatorDraft.value = {
      ...creatorDraft.value,
      ...payload,
      words: Array.isArray(payload.words) ? payload.words : creatorDraft.value.words,
      validationIssues: Array.isArray(payload.validationIssues) ? payload.validationIssues : []
    }
    if (Array.isArray(payload.lessonData) && payload.lessonData.length) {
      creatorLessons.value = payload.lessonData as CreatorLesson[]
      selectedCreatorLessonId.value = creatorLessons.value[0].id
    }
    audioAttached.value = Boolean(payload.audioAttached)
    await saveDraft()
    creatorDrafts.value = [...creatorDrafts.value.filter(draft => draft.id !== creatorDraft.value.id), buildDraftSnapshot()]
  }
  catch {
    showToast('Draft import failed. Please choose a course JSON file.', 'warning')
  }
  input.value = ''
}

function addWord() {
  if (!selectedCreatorLesson.value) return
  const word = newWord.value.trim()
  if (!word) return
  selectedCreatorLesson.value.words = Array.from(new Set([...selectedCreatorLesson.value.words, word]))
  newWord.value = ''
}

function removeWord(word: string) {
  if (!selectedCreatorLesson.value) return
  selectedCreatorLesson.value.words = selectedCreatorLesson.value.words.filter(item => item !== word)
}

function addChip() {
  if (!selectedCreatorExercise.value) return
  const chip = newChip.value.trim()
  if (!chip) return
  selectedCreatorExercise.value.chips = Array.from(new Set([...selectedCreatorExercise.value.chips, chip]))
  newChip.value = ''
}

function removeChip(chip: string) {
  if (!selectedCreatorExercise.value) return
  selectedCreatorExercise.value.chips = selectedCreatorExercise.value.chips.filter(item => item !== chip)
}

function addChipToExercise(exercise: CreatorExercise) {
  const chip = window.prompt('Add answer chip')?.trim()
  if (!chip) return
  exercise.chips = Array.from(new Set([...exercise.chips, chip]))
  if (exercise.type === 'sentence-order' || exercise.type === 'dialogue-order-lines') exercise.orderItems = Array.from(new Set([...exercise.orderItems, chip]))
}

function setExerciseChipsFromInput(exercise: CreatorExercise, value: string) {
  exercise.chips = value.split('|').map(item => item.trim()).filter(Boolean)
}

function setOrderItemsFromInput(exercise: CreatorExercise, value: string) {
  exercise.orderItems = value.split('|').map(item => item.trim()).filter(Boolean)
  exercise.answer = exercise.orderItems.join(' ')
}

async function awardPracticeXp(amount: number, label: string, origin?: XpOrigin) {
  await saveXpGain(amount, label, {}, origin)
}

function createCreatorExercise(title = 'New practice prompt'): CreatorExercise {
  return {
    id: `exercise-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    type: 'choice',
    prompt: title,
    sentence: '例文を入力します。',
    reading: '',
    translation: 'Example translation',
    blankBefore: '',
    blankAfter: '',
    answer: 'answer',
    chips: ['answer'],
    orderItems: ['answer'],
    hint: 'Add a helpful hint for learners.',
    grammarTitle: 'Grammar Note',
    grammarNote: 'Explain the grammar or usage behind this exercise.',
    example: '例文です。',
    exampleReading: '',
    exampleTranslation: 'This is an example sentence.'
  }
}

function addCreatorLesson() {
  const nextNumber = creatorLessons.value.length + 1
  const lesson: CreatorLesson = {
    id: `lesson-${Date.now()}`,
    title: `Lesson ${nextNumber}`,
    explanation: 'Write the lesson explanation here.',
    words: [],
    exercises: [createCreatorExercise('Choose the correct answer.')]
  }
  creatorLessons.value = [...creatorLessons.value, lesson]
  selectedCreatorLessonId.value = lesson.id
}

function removeCreatorLesson(id: string) {
  if (creatorLessons.value.length === 1) {
    showToast('A course needs at least one lesson.', 'warning')
    return
  }
  creatorLessons.value = creatorLessons.value.filter(lesson => lesson.id !== id)
  selectedCreatorLessonId.value = creatorLessons.value[0].id
}

function addCreatorExercise() {
  if (!selectedCreatorLesson.value) return
  selectedCreatorLesson.value.exercises.push(createCreatorExercise())
}

function removeCreatorExercise(id: string) {
  if (!selectedCreatorLesson.value) return
  if (selectedCreatorLesson.value.exercises.length === 1) {
    showToast('A lesson needs at least one exercise.', 'warning')
    return
  }
  selectedCreatorLesson.value.exercises = selectedCreatorLesson.value.exercises.filter(exercise => exercise.id !== id)
}

function attachAudio() {
  audioAttached.value = true
  showToast('Audio requirement marked complete', 'success')
}

function addOrderItem(item: string) {
  if (lessonState.value !== 'idle') return
  orderedAnswer.value = [...orderedAnswer.value, item]
}

function removeOrderItem(index: number) {
  if (lessonState.value !== 'idle') return
  orderedAnswer.value = orderedAnswer.value.filter((_, itemIndex) => itemIndex !== index)
}

function resetLessonAttempt() {
  selectedAnswer.value = ''
  orderedAnswer.value = []
  lessonState.value = 'idle'
  lessonHintVisible.value = false
  showAlternativeReading.value = false
}

function checkLessonAnswer() {
  const answer = isOrderingExercise.value ? orderedAnswer.value.join(' ') : selectedAnswer.value
  if (!answer) {
    showToast('Choose an answer first.', 'warning')
    return
  }
  lessonState.value = answer === currentExercise.value.correctAnswer ? 'correct' : 'incorrect'
  if (lessonState.value === 'correct') showToast('Correct.', 'success')
}

function checkVocabularyAnswer(answer = selectedVocabularyAnswer.value, origin?: XpOrigin) {
  if (vocabularyFeedback.value === 'correct') return
  selectedVocabularyAnswer.value = answer
  vocabularyFeedback.value = answer === activeVocabularyItem.value?.meaning ? 'correct' : 'incorrect'
  if (vocabularyFeedback.value === 'correct') void awardPracticeXp(5, 'vocabulary', origin)
}

function nextPracticeIndex(currentIndex: number, length: number, randomize: boolean) {
  if (length <= 1) return 0
  if (!randomize) return currentIndex < length - 1 ? currentIndex + 1 : 0
  const nextIndex = Math.floor(Math.random() * length)
  return nextIndex === currentIndex ? (nextIndex + 1) % length : nextIndex
}

function nextVocabularyItem(event?: MouseEvent) {
  if (vocabularyFeedback.value !== 'correct') {
    checkVocabularyAnswer(selectedVocabularyAnswer.value, xpOriginFromEvent(event))
    return
  }
  vocabularyIndex.value = nextPracticeIndex(vocabularyIndex.value, vocabularyItems.value.length, randomVocabularyPractice.value)
  selectedVocabularyAnswer.value = ''
  vocabularyFeedback.value = 'idle'
}

async function continueLesson(event?: MouseEvent) {
  if (lessonState.value === 'incorrect') {
    resetLessonAttempt()
    return
  }
  if (lessonState.value !== 'correct') {
    checkLessonAnswer()
    return
  }
  await completeLesson(xpOriginFromEvent(event))
}

async function completeLesson(origin?: XpOrigin) {
  if (selectedExerciseIndex.value < selectedLesson.value.exercises.length - 1) {
    selectedExerciseIndex.value += 1
    selectedAnswer.value = ''
    orderedAnswer.value = []
    lessonState.value = 'idle'
    lessonHintVisible.value = false
    showAlternativeReading.value = false
    return
  }

  const nextCompletedLessons = {
    ...(profile.value.completedLessons || {}),
    [selectedCourse.value.id]: Array.from(new Set([...(profile.value.completedLessons?.[selectedCourse.value.id] || []), selectedLesson.value.id]))
  }
  await saveXpGain(20, 'earned', {
    completedLessons: nextCompletedLessons,
    badges: Array.from(new Set([...profile.value.badges, 'Lesson Builder']))
  }, origin)
  const updatedCourses = await Promise.all(courses.value.map(course => {
    if (course.id !== selectedCourse.value?.id) return course
    const lessonStep = Math.ceil(100 / Math.max(selectedContent.value.lessons.length, 1))
    return database.saveCourse({ ...course, progress: Math.min(100, Math.max(course.progress, (selectedLessonIndex.value + 1) * lessonStep)) })
  }))
  courses.value = updatedCourses

  if (selectedLessonIndex.value < selectedContent.value.lessons.length - 1) {
    selectedLessonIndex.value += 1
    selectedExerciseIndex.value = 0
    selectedAnswer.value = ''
    orderedAnswer.value = []
    lessonState.value = 'idle'
    lessonHintVisible.value = false
    showAlternativeReading.value = false
    return
  }

  switchView('map')
}

function checkCharacterAnswer(answer = selectedCharacterAnswer.value, event?: MouseEvent) {
  if (characterAdvancing.value) return
  selectedCharacterAnswer.value = answer
  const correctAnswer = activeCharacterPrompt.value?.correctAnswer || 'ki'
  characterFeedback.value = answer === correctAnswer ? 'correct' : 'incorrect'
  if (answer === correctAnswer) {
    void awardPracticeXp(5, 'character', xpOriginFromEvent(event))
    characterAdvancing.value = true
    window.setTimeout(() => {
      characterPromptIndex.value = nextPracticeIndex(characterPromptIndex.value, characterPrompts.value.length, randomCharacterPractice.value)
      selectedCharacterAnswer.value = ''
      characterFeedback.value = 'idle'
      characterAdvancing.value = false
    }, 650)
  }
  else {
    showToast(`Try again: ${activeCharacterPrompt.value?.character || 'き'} is read as ${correctAnswer}`, 'warning')
  }
}

function toggleSettings() {
  showSettings.value = !showSettings.value
}

function openProfile() {
  switchView('profile')
}
</script>

<template>
  <Transition name="shell-fade" mode="out-in">
  <div v-if="currentView === 'lesson'" key="lesson" class="lesson-shell">
    <aside class="sidebar lesson-sidebar">
      <div class="brand">
        <div class="brand-mark">Z</div>
        <div>
          <h1 class="brand-title">ZenStudy</h1>
          <span class="brand-subtitle">Local-first Learning</span>
        </div>
      </div>

      <nav class="nav-group" aria-label="Main navigation">
        <button v-for="item in navigation" :key="item.key" class="nav-button" :class="{ active: currentView === item.key }" @click="switchView(item.key)">
          <Icon :name="item.icon" size="1.4rem" />
          <span>{{ t(item.labelKey) }}</span>
        </button>
      </nav>

      <div class="nav-footer nav-group">
        <button class="sidebar-profile profile-link" aria-label="Open profile" @click="openProfile">
          <div class="sidebar-streak"><Icon name="material-symbols:local-fire-department" /> <strong>{{ profile.streak }}</strong><span>{{ t('dayStreak') }}</span></div>
          <div class="sidebar-level">
            <div class="action-row" style="justify-content: space-between; gap: .75rem;">
              <strong>{{ t('level') }} {{ profileLevel }}</strong>
              <span>{{ displayedXp.toLocaleString() }} XP</span>
            </div>
            <div ref="xpTargetRef" class="progress-track sidebar-level-track" :class="{ pulse: xpBarPulse }"><div class="progress-fill" :style="{ width: `${levelProgress}%` }" /></div>
            <small>{{ xpToNextLevel }} {{ t('xpToNext') }}</small>
          </div>
        </button>
        <button class="nav-button" @click="toggleSettings">
          <Icon name="material-symbols:settings" size="1.4rem" /> {{ t('settings') }}
        </button>
        <button class="nav-button" @click="fetchRepository">
          <Icon name="material-symbols:cloud-done" size="1.4rem" /> {{ online ? t('online') : t('offlineMode') }}
        </button>
      </div>
    </aside>

    <main class="lesson-main">
      <header class="lesson-topbar">
        <button class="ghost-button" aria-label="Close lesson" @click="switchView('map')">
          <Icon name="material-symbols:close" size="1.5rem" />
        </button>
        <div class="progress-track" aria-label="Lesson progress">
          <div class="progress-fill" :style="{ width: `${lessonProgress}%` }" />
        </div>
        <strong>{{ lessonProgress }}%</strong>
        <button class="ghost-button" aria-label="Report issue">
          <Icon name="material-symbols:flag" size="1.5rem" />
        </button>
      </header>

      <section class="lesson-canvas">
        <div style="text-align: center;">
          <p class="eyebrow" style="color: var(--zs-primary); font-weight: 800;">{{ selectedCourse.name }} / {{ selectedLesson.title }}</p>
          <h1 style="font-size: 1.35rem; font-weight: 500;">{{ currentExercise.prompt }}</h1>
        </div>

        <article class="card card-accent exercise-card" style="--accent: var(--zs-primary);">
          <div v-if="currentExercise.type === 'fill-blank' && lessonState === 'idle'" class="sentence cjk" aria-label="Sentence with blank">
            <span>{{ currentExercise.blankBefore }}</span><span class="blank" /><span>{{ currentExercise.blankAfter }}</span>
          </div>
          <div v-else class="sentence cjk" aria-label="Exercise sentence">
            <span>{{ exerciseDisplaySentence || currentExercise.sentence }}</span>
          </div>
          <Transition name="reading-reveal">
            <p v-if="currentExercise.reading && showAlternativeReading" class="reading-line cjk">{{ currentExercise.reading }}</p>
          </Transition>
          <p class="muted" style="font-size: 1.25rem;">
            {{ currentExercise.type === 'translate' && lessonState === 'idle' ? 'Select the best answer.' : currentExercise.translation }}
          </p>
          <div class="exercise-tools">
            <button v-if="currentExercise.reading" class="ghost-button reading-toggle" @click="showAlternativeReading = !showAlternativeReading">
              <Icon name="material-symbols:visibility" /> {{ showAlternativeReading ? 'Hide reading' : 'Show reading' }}
            </button>
            <button class="primary-button audio-button" aria-label="Play audio">
              <Icon name="material-symbols:volume-up" size="1.5rem" />
            </button>
          </div>
        </article>

        <div v-if="isOrderingExercise" class="ordering-builder">
          <div class="ordered-answer cjk" aria-label="Current ordered answer">
            <button v-for="(item, index) in orderedAnswer" :key="`${item}-${index}`" class="order-chip selected" @click="removeOrderItem(index)">{{ item }}</button>
            <span v-if="!orderedAnswer.length" class="muted">Tap chunks in order.</span>
          </div>
          <div class="order-chip-row cjk">
            <button v-for="(item, index) in availableOrderItems" :key="`${item}-${index}`" class="order-chip" @click="addOrderItem(item)">{{ item }}</button>
          </div>
        </div>

        <div v-else class="answer-grid lesson-answer-grid">
          <button v-for="answer in currentExercise.options" :key="answer" class="answer-button cjk" :class="{ selected: selectedAnswer === answer, correct: lessonState === 'correct' && answer === currentExercise.correctAnswer, incorrect: lessonState === 'incorrect' && selectedAnswer === answer }" @click="selectedAnswer = answer">
            {{ answer }}
          </button>
        </div>

        <div class="action-row" style="width: min(100%, 34rem); justify-content: space-between; margin-top: auto;">
          <button v-if="currentExercise.hint" class="ghost-button hint-button" @click="lessonHintVisible = !lessonHintVisible">
            <Icon name="material-symbols:lightbulb" /> Hint
          </button>
            <button class="primary-button" @click="continueLesson($event)">
              {{ lessonState === 'correct' ? 'Continue' : lessonState === 'incorrect' ? 'Try again' : 'Check' }} <Icon name="material-symbols:arrow-forward" />
          </button>
        </div>

          <Transition name="soft-appear">
            <article v-if="(lessonHintVisible && currentExercise.hint) || lessonState !== 'idle'" :class="['feedback-card', lessonState]">
              <strong>{{ lessonState === 'correct' ? 'Correct' : lessonState === 'incorrect' ? 'Not quite' : 'Hint' }}</strong>
              <span>{{ lessonState === 'correct' ? `Correct answer: ${currentExercise.correctAnswer}` : lessonState === 'incorrect' ? `Correct answer: ${currentExercise.correctAnswer}` : currentExercise.hint }}</span>
            </article>
          </Transition>
      </section>
    </main>

    <aside class="lesson-aside">
      <Transition name="lesson-aside-reveal" mode="out-in">
        <div v-if="lessonState === 'idle'" key="locked" class="lesson-aside-placeholder card">
          <Icon name="material-symbols:lock" />
          <strong>Check to reveal</strong>
          <span class="muted">Notes, examples, and reading hints unlock after your answer.</span>
        </div>
        <div v-else key="revealed" class="lesson-aside-content">
          <h2><Icon name="material-symbols:menu-book" class="success-icon" /> Grammar Note</h2>
          <article class="card" style="border-left: 4px solid var(--zs-primary);">
            <h3 style="color: var(--zs-primary);">{{ currentExercise.grammarTitle }}</h3>
            <p class="muted">{{ currentExercise.grammarNote }}</p>
            <div class="tag cjk">{{ currentExercise.correctAnswer }}</div>
          </article>
          <article class="card">
            <p class="eyebrow">Example</p>
            <p class="cjk" style="font-size: 1.25rem;">{{ currentExercise.example }}</p>
            <p v-if="currentExercise.exampleReading && showAlternativeReading" class="reading-line cjk">{{ currentExercise.exampleReading }}</p>
            <p class="muted">{{ currentExercise.exampleTranslation }}</p>
          </article>
          <article class="validation-card warning">
            <strong>Reading hint</strong>
            <span class="muted">When は is used as a particle, it is pronounced “wa”.</span>
          </article>
        </div>
      </Transition>
    </aside>

    <aside v-if="showSettings" class="settings-drawer card">
      <button class="ghost-button drawer-close" aria-label="Close settings" @click="toggleSettings"><Icon name="material-symbols:close" /></button>
      <h2>{{ t('settings') }}</h2>
      <label class="settings-row">{{ t('uiLanguage') }}
        <Select :model-value="uiLanguage" :options="uiLanguageOptions" option-label="label" option-value="value" @update:model-value="setUiLanguage($event)" />
      </label>
      <label class="settings-row">{{ t('dailyXpGoal') }} <input v-model.number="profile.dailyGoal" class="input" type="number" min="10" step="10" @change="database.saveProfile(profile)" /></label>
      <button class="primary-button" @click="database.saveProfile(profile); showToast('Settings saved', 'success')"><Icon name="material-symbols:save" /> {{ t('saveSettings') }}</button>
    </aside>

    <div class="toast-stack" aria-live="polite">
      <div v-for="toast in toastMessages" :key="toast.id" :class="['toast', toast.tone]">
        <Icon :name="toast.tone === 'success' ? 'material-symbols:check-circle' : toast.tone === 'warning' ? 'material-symbols:warning' : 'material-symbols:info'" />
        {{ toast.message }}
      </div>
    </div>
    <div class="xp-particle-layer" aria-hidden="true">
      <span
        v-for="particle in xpParticles"
        :key="particle.id"
        class="xp-particle"
        :style="{
          left: `${particle.x}px`,
          top: `${particle.y}px`,
          '--xp-start-x': `${particle.x}px`,
          '--xp-start-y': `${particle.y}px`,
          '--xp-burst-x': `${particle.burstX}px`,
          '--xp-burst-y': `${particle.burstY}px`,
          '--xp-x-35': `${particle.x35}px`,
          '--xp-y-35': `${particle.y35}px`,
          '--xp-x-72': `${particle.x72}px`,
          '--xp-y-72': `${particle.y72}px`,
          '--xp-end-x': `${particle.endX}px`,
          '--xp-end-y': `${particle.endY}px`,
          '--xp-angle': `${particle.angle}deg`,
          '--xp-delay': `${particle.delay}ms`,
          '--xp-size': `${particle.size}rem`
        }"
      />
    </div>
  </div>

  <div v-else key="app" class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">Z</div>
        <div>
          <h1 class="brand-title">ZenStudy</h1>
          <span class="brand-subtitle">Local-first Learning</span>
        </div>
      </div>

      <nav class="nav-group" aria-label="Main navigation">
        <button v-for="item in navigation" :key="item.key" class="nav-button" :class="{ active: currentView === item.key }" @click="switchView(item.key)">
          <Icon :name="item.icon" size="1.4rem" />
          <span>{{ t(item.labelKey) }}</span>
        </button>
      </nav>

      <div class="nav-footer nav-group">
        <button class="sidebar-profile profile-link" aria-label="Open profile" @click="openProfile">
          <div class="sidebar-streak"><Icon name="material-symbols:local-fire-department" /> <strong>{{ profile.streak }}</strong><span>{{ t('dayStreak') }}</span></div>
          <div class="sidebar-level">
            <div class="action-row" style="justify-content: space-between; gap: .75rem;">
              <strong>{{ t('level') }} {{ profileLevel }}</strong>
              <span>{{ displayedXp.toLocaleString() }} XP</span>
            </div>
            <div ref="xpTargetRef" class="progress-track sidebar-level-track" :class="{ pulse: xpBarPulse }"><div class="progress-fill" :style="{ width: `${levelProgress}%` }" /></div>
            <small>{{ xpToNextLevel }} {{ t('xpToNext') }}</small>
          </div>
        </button>
        <button class="nav-button" @click="toggleSettings">
          <Icon name="material-symbols:settings" size="1.4rem" /> {{ t('settings') }}
        </button>
        <button class="nav-button" @click="fetchRepository">
          <Icon name="material-symbols:cloud-done" size="1.4rem" /> {{ online ? t('online') : t('offlineMode') }}
        </button>
      </div>
    </aside>

    <nav class="mobile-tabs" aria-label="Mobile navigation">
      <button v-for="item in navigation" :key="item.key" class="nav-button" :class="{ active: currentView === item.key }" @click="switchView(item.key)">
        <Icon :name="item.icon" size="1.45rem" />
      </button>
    </nav>

    <main class="page">
      <Transition name="page-fade" mode="out-in">
        <div :key="currentView" class="view-transition-frame">
      <div v-if="currentView === 'dashboard'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <p class="eyebrow">{{ t('welcomeBack') }}</p>
            <h1>Student</h1>
          </div>
        </header>

        <section>
          <h2>{{ t('activeCourses') }}</h2>
          <div v-if="activeCourses.length" class="grid-2">
            <article v-for="course in activeCourses" :key="course.id" class="card card-accent" style="--accent: var(--zs-primary);">
              <div class="action-row" style="justify-content: space-between; align-items: flex-start;">
                <div>
                  <h3>{{ course.name }}</h3>
                  <p class="muted"><span class="language-meta language-meta-icons" aria-label="Language direction"><Icon :name="languageFlagIcon(course.sourceLanguage)" /> <span>→</span> <Icon :name="languageFlagIcon(course.targetLanguage)" /></span></p>
                </div>
                <span class="status-pill success"><Icon name="material-symbols:cloud-done" /> IndexedDB</span>
              </div>
              <div style="margin: 1.5rem 0;">
                <div class="action-row" style="justify-content: space-between;"><span>Progress</span><strong>{{ course.progress }}%</strong></div>
                <div class="progress-track"><div class="progress-fill" :style="{ width: `${course.progress}%` }" /></div>
              </div>
              <div class="action-row" style="justify-content: space-between;">
                <span class="cjk" style="font-size: 1.75rem;">{{ course.id.includes('hiragana') ? 'あいうえお' : 'こんにちは' }}</span>
                <button class="primary-button" @click="openCourse(course, course.id.includes('hiragana') ? 'characters' : 'map')">{{ course.id.includes('hiragana') ? 'Practice' : 'Continue' }}</button>
              </div>
            </article>
          </div>
          <article v-else class="card empty-state">
            <Icon name="material-symbols:menu-book" />
            <strong>No local courses yet</strong>
            <span class="muted">Add a course from the repository to start learning.</span>
            <button class="primary-button" @click="switchView('repository')">{{ t('courses') }}</button>
          </article>
        </section>

        <section class="panel card">
          <h2>{{ t('dailyGoal') }}</h2>
          <p class="muted">{{ profile.dailyXp }} of {{ profile.dailyGoal }} XP earned today</p>
          <div class="progress-track"><div class="progress-fill" :style="{ width: `${dailyProgress}%` }" /></div>
        </section>

        <section class="panel card">
          <h2>{{ t('recentAchievements') }}</h2>
          <div class="chip-row">
            <span v-for="badge in profile.badges" :key="badge" class="tag"><Icon name="material-symbols:workspace-premium" /> {{ badge }}</span>
          </div>
        </section>
      </div>

      <div v-else-if="currentView === 'profile'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <p class="eyebrow">Profile</p>
            <h1>Student</h1>
          </div>
          <div class="metric-row profile-metric-row">
            <div class="metric streak-metric"><Icon name="material-symbols:local-fire-department" style="color: var(--zs-primary);" /><div><strong>{{ profile.streak }}</strong><span>{{ t('dayStreak') }}</span></div></div>
            <div class="metric level-metric">
              <Icon name="material-symbols:military-tech" style="color: var(--zs-primary);" />
              <div>
                <div class="action-row" style="justify-content: space-between; gap: 1rem;">
                  <strong>{{ t('level') }} {{ profileLevel }}</strong>
                  <span>{{ displayedXp.toLocaleString() }} XP</span>
                </div>
                <div class="progress-track"><div class="progress-fill" :style="{ width: `${levelProgress}%` }" /></div>
                <small>{{ xpToNextLevel }} {{ t('xpToNext') }}</small>
              </div>
            </div>
          </div>
        </header>

        <section class="grid-2">
          <article class="card profile-panel">
            <div class="action-row" style="justify-content: space-between;">
              <h2>Running Courses</h2>
              <span class="status-pill">{{ runningCourses.length }}</span>
            </div>
            <div v-if="runningCourses.length" class="profile-course-list">
              <button v-for="course in runningCourses" :key="course.id" class="profile-course-row" @click="openCourse(course, 'map')">
                <span><strong>{{ course.name }}</strong><small>{{ courseCompletion[course.id]?.completedCount || 0 }} / {{ courseCompletion[course.id]?.lessonCount || course.stats.lessons }} lessons</small></span>
                <span class="profile-progress"><span>{{ courseCompletion[course.id]?.progress || course.progress }}%</span><span class="progress-track"><span class="progress-fill" :style="{ width: `${courseCompletion[course.id]?.progress || course.progress}%` }" /></span></span>
              </button>
            </div>
            <p v-else class="muted">No courses in progress.</p>
          </article>

          <article class="card profile-panel">
            <div class="action-row" style="justify-content: space-between;">
              <h2>Completed Courses</h2>
              <span class="status-pill success">{{ completedCourses.length }}</span>
            </div>
            <div v-if="completedCourses.length" class="profile-course-list">
              <button v-for="course in completedCourses" :key="course.id" class="profile-course-row" @click="openCourse(course, 'map')">
                <span><strong>{{ course.name }}</strong><small>{{ courseCompletion[course.id]?.lessonCount || course.stats.lessons }} lessons completed</small></span>
                <Icon name="material-symbols:check-circle" style="color: var(--zs-primary);" />
              </button>
            </div>
            <p v-else class="muted">Completed courses will appear here.</p>
          </article>
        </section>

        <section class="card profile-panel">
          <div class="action-row" style="justify-content: space-between;">
            <h2>{{ t('recentAchievements') }}</h2>
            <span class="status-pill">{{ profile.badges.length }}</span>
          </div>
          <div v-if="profile.badges.length" class="badge-grid">
            <article v-for="badge in profile.badges" :key="badge" class="badge-card">
              <Icon name="material-symbols:workspace-premium" />
              <strong>{{ badge }}</strong>
            </article>
          </div>
          <p v-else class="muted">Badges earned through repositories, lessons, and practice will show here.</p>
        </section>
      </div>

      <div v-else-if="currentView === 'repository'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <h1>{{ t('repository') }}</h1>
            <p class="muted"><Icon name="material-symbols:database" /> Local-first / IndexedDB compatible</p>
          </div>
          <div class="action-row">
            <label class="secondary-button file-button">
              <Icon name="material-symbols:upload" /> {{ t('importJson') }}
              <input type="file" accept="application/json" class="sr-only" @change="importLibrary" />
            </label>
            <button class="secondary-button" @click="exportLibrary"><Icon name="material-symbols:download" /> {{ t('exportLibrary') }}</button>
          </div>
        </header>

        <div class="repo-toolbar">
          <input v-model="repositoryUrl" class="input" aria-label="Repository URL" placeholder="Repository server URL" />
          <button class="secondary-button" @click="fetchRepository()"><Icon name="material-symbols:sync" /> {{ t('fetch') }}</button>
          <button class="primary-button" @click="addAllCourses"><Icon name="material-symbols:add" /> {{ t('addAll') }}</button>
        </div>
        <label class="filter-toggle">
          <input v-model="showOnlyNonAdded" type="checkbox" />
          <span>{{ t('showOnlyNonAdded') }}</span>
        </label>
        <p class="repo-status"><Icon name="material-symbols:info" /> {{ repositoryStatus }} · {{ totalDownloaded }} local courses</p>

        <section class="repository-section-list">
          <article v-for="section in visibleRepositorySections" :key="section.id" class="card repository-section-card">
            <button class="repository-section-header" @click="toggleRepositorySection(section.id)">
              <span><Icon :name="section.expanded ? 'material-symbols:expand-more' : 'material-symbols:chevron-right'" /> {{ section.url }}</span>
              <span class="status-pill">{{ section.courses.length }} {{ section.courses.length === 1 ? 'course' : 'courses' }}</span>
            </button>
            <p class="repo-status"><Icon name="material-symbols:info" /> {{ section.status }}</p>
            <Transition name="soft-appear">
              <div v-if="section.expanded" class="repository-course-grid">
                <article v-for="course in section.courses" :key="course.id" class="card course-card card-accent" style="--accent: var(--zs-primary);">
                  <div class="course-content">
                    <div>
                      <div class="action-row" style="justify-content: space-between; align-items: flex-start;">
                        <h3>{{ course.name }}</h3>
                        <span class="version-pill">v{{ course.version }}</span>
                      </div>
                      <p class="muted">{{ course.description }}</p>
                    </div>
                    <div class="course-meta-row">
                      <span class="language-meta"><Icon :name="languageFlagIcon(course.sourceLanguage)" /> {{ languageLabel(course.sourceLanguage) }} <span>→</span> <Icon :name="languageFlagIcon(course.targetLanguage)" /> {{ languageLabel(course.targetLanguage) }}</span>
                      <span v-for="level in course.levels" :key="level" class="meta-pill">{{ level }}</span>
                    </div>
                    <div class="chip-row course-tags">
                      <span v-for="tag in course.tags" :key="tag" class="tag">{{ tag }}</span>
                    </div>
                    <div class="course-stats-grid">
                      <span><strong>{{ course.stats.words }}</strong> words</span>
                      <span><strong>{{ course.stats.sentences }}</strong> sentences</span>
                      <span><strong>{{ course.stats.dialogues }}</strong> dialogues</span>
                      <span><strong>{{ course.stats.characterTables }}</strong> tables</span>
                    </div>
                    <div class="action-row" style="justify-content: space-between; border-top: 1px solid var(--zs-border); padding-top: 1rem;">
                      <span :class="['status-pill', course.syncStatus === 'downloaded' ? 'success' : '']">{{ course.syncStatus === 'downloaded' ? t('downloaded') : t('available') }}</span>
                      <div class="action-row">
                        <button class="secondary-button" @click="openCourse(course, 'map')"><Icon name="material-symbols:route" /> {{ t('view') }}</button>
                        <button v-if="course.syncStatus !== 'downloaded'" class="primary-button" @click="addCourse(course)">
                          <Icon name="material-symbols:add" /> {{ t('add') }}
                        </button>
                        <button v-else class="secondary-button danger-button" @click="removeCourse(course.id)">
                          <Icon name="material-symbols:delete" /> {{ t('remove') }}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
                <article v-if="!section.courses.length" class="card empty-state">
                  <Icon name="material-symbols:filter-list" />
                  <strong>No visible courses</strong>
                  <span>Try disabling the non-added filter.</span>
                </article>
              </div>
            </Transition>
          </article>
        </section>
      </div>

      <div v-else-if="currentView === 'map'" class="page-inner">
        <header class="page-header">
          <button class="ghost-button" @click="switchView('repository')"><Icon name="material-symbols:arrow-back" /> Courses</button>
          <div class="map-header-controls">
            <Select v-if="activeCourses.length" class="course-select" :model-value="activeCourse?.id" :options="activeCourses" option-label="name" option-value="id" @update:model-value="selectPracticeCourse($event)" />
            <span class="status-pill success"><Icon name="material-symbols:local-fire-department" /> {{ profile.streak }} Day Streak</span>
          </div>
        </header>
        <section v-if="activeCourse && activeContent" class="map-canvas">
          <div style="text-align: center; max-width: 42rem; margin-bottom: 4rem;">
            <p class="eyebrow">{{ activeCourse.name }}</p>
            <h1>{{ activeContent.mapTitle }}</h1>
            <p class="muted" style="font-size: 1.25rem;">{{ activeContent.mapDescription }}</p>
          </div>
          <div class="lesson-path">
            <div v-for="(lesson, index) in activeContent.lessons" :key="lesson.id" class="path-node">
              <div class="node-icon" :class="{ current: index === selectedLessonIndex && !completedLessonSet.has(lesson.id), completed: completedLessonSet.has(lesson.id) }">
                <Icon :name="lesson.locked ? 'material-symbols:lock' : completedLessonSet.has(lesson.id) ? 'material-symbols:check' : 'material-symbols:play-arrow'" size="1.8rem" />
              </div>
              <article class="card map-lesson-card" :style="index === selectedLessonIndex && !completedLessonSet.has(lesson.id) ? 'border-color: var(--zs-primary); border-width: 2px;' : lesson.locked ? 'opacity: .6;' : completedLessonSet.has(lesson.id) ? 'border-color: var(--zs-primary);' : ''">
                <h3>Lesson {{ index + 1 }}: {{ lesson.title }}</h3>
                <p class="eyebrow">{{ lesson.unitTitle }}</p>
                <p class="muted">{{ lesson.description }}</p>
                <div class="map-lesson-actions">
                  <span v-if="completedLessonSet.has(lesson.id)" class="status-pill success map-status-pill"><Icon name="material-symbols:check-circle" /> Completed</span>
                  <button class="secondary-button compact-button" :disabled="lesson.locked" @click="startLesson(index)"><Icon name="material-symbols:play-arrow" /> Play</button>
                </div>
              </article>
            </div>
          </div>
          <button class="primary-button map-start-button" @click="startLesson(selectedLessonIndex)">Start {{ selectedLesson.title }} <Icon name="material-symbols:play-arrow" /></button>
        </section>
        <section v-else class="card empty-state">
          <Icon name="material-symbols:download" />
          <h2>No Added Course</h2>
          <p>Add a course from the repository before opening the course map.</p>
          <button class="primary-button" @click="switchView('repository')"><Icon name="material-symbols:add" /> Browse Courses</button>
        </section>
      </div>

      <div v-else-if="currentView === 'characters'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <h1>Character Table Practice</h1>
            <p class="muted">{{ t('practiceCharactersFromCourse') }}</p>
          </div>
          <Select v-if="characterCourseOptions.length" class="course-select" :model-value="activeCourse?.id" :options="characterCourseOptions" option-label="name" option-value="id" @update:model-value="selectPracticeCourse($event)" />
        </header>
        <section v-if="!characterCourseOptions.length" class="card empty-state">
          <Icon name="material-symbols:table-chart" />
          <h2>No Character Tables Added</h2>
          <p>Add a course with character-table content before practicing characters.</p>
          <button class="primary-button" @click="switchView('repository')"><Icon name="material-symbols:add" /> Browse Courses</button>
        </section>
        <template v-else-if="activeCourse && activeContent && characterPrompts.length">
        <section class="practice-toolbar card">
          <strong>{{ randomCharacterPractice ? t('randomPractice') : t('sequentialPractice') }}</strong>
          <label class="toggle-row"><span>{{ t('random') }}</span><ToggleSwitch v-model="randomCharacterPractice" /></label>
        </section>
        <section class="grid-2">
          <article class="card card-accent" style="--accent: var(--zs-primary);">
            <h2>{{ activeCourse.name }}</h2>
            <div class="char-grid cjk">
              <button v-for="char in activeContent.characters" :key="char" class="char-cell" :class="{ active: char === activeCharacterPrompt?.character }">{{ char }}</button>
            </div>
          </article>
          <article class="card">
            <p class="eyebrow">Prompt</p>
            <h2>Choose the reading for <span class="cjk">{{ activeCharacterPrompt?.character || 'き' }}</span></h2>
            <div class="answer-grid" style="grid-template-columns: repeat(2, 1fr); width: 100%;">
              <button v-for="answer in activeCharacterPrompt?.answers || ['ka', 'ki', 'ku', 'ke']" :key="answer" class="answer-button" :class="{ selected: selectedCharacterAnswer === answer, correct: characterFeedback === 'correct' && answer === activeCharacterPrompt?.correctAnswer, incorrect: characterFeedback === 'incorrect' && selectedCharacterAnswer === answer }" :disabled="characterAdvancing" @click="selectedCharacterAnswer = answer">{{ answer }}</button>
            </div>
            <button class="primary-button" style="margin-top: 1.5rem;" :disabled="characterAdvancing || !selectedCharacterAnswer" @click="checkCharacterAnswer(selectedCharacterAnswer, $event)">Check</button>
            <Transition name="soft-appear">
              <p v-if="characterFeedback !== 'idle'" :class="['feedback-text', characterFeedback]">
                {{ characterFeedback === 'correct' ? `Correct. ${activeCharacterPrompt?.character || 'き'} is read as ${activeCharacterPrompt?.correctAnswer || 'ki'}.` : `Not quite. ${activeCharacterPrompt?.character || 'き'} is read as ${activeCharacterPrompt?.correctAnswer || 'ki'}.` }}
              </p>
            </Transition>
          </article>
        </section>
        </template>
      </div>

      <div v-else-if="currentView === 'vocabulary'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <h1>{{ t('vocabularyPractice') }}</h1>
            <p class="muted">{{ t('trainWordsFromCourse') }}</p>
          </div>
          <Select v-if="activeCourses.length" class="course-select" :model-value="activeCourse?.id" :options="activeCourses" option-label="name" option-value="id" @update:model-value="selectPracticeCourse($event)" />
        </header>
        <section v-if="!activeCourses.length" class="card empty-state">
          <Icon name="material-symbols:style" />
          <h2>{{ t('noAddedCourse') }}</h2>
          <p>Add a course before training vocabulary.</p>
          <button class="primary-button" @click="switchView('repository')"><Icon name="material-symbols:add" /> Browse Courses</button>
        </section>
        <section v-else-if="!vocabularyItems.length" class="card empty-state">
          <Icon name="material-symbols:style" />
          <h2>{{ t('noVocabularyYet') }}</h2>
          <p>This course does not expose vocabulary items yet.</p>
          <button class="secondary-button" @click="switchView('creator')"><Icon name="material-symbols:edit-note" /> Add Words in Creator</button>
        </section>
        <template v-else>
          <section class="practice-toolbar card">
            <strong>{{ randomVocabularyPractice ? t('randomPractice') : t('sequentialPractice') }}</strong>
            <label class="toggle-row"><span>{{ t('random') }}</span><ToggleSwitch v-model="randomVocabularyPractice" /></label>
          </section>
          <section class="grid-2">
            <article class="card card-accent vocab-card" style="--accent: var(--zs-primary);">
              <p class="eyebrow">Term</p>
              <h2 class="cjk">{{ activeVocabularyItem.term }}</h2>
              <p v-if="activeVocabularyItem.reading" class="reading-line cjk">{{ activeVocabularyItem.reading }}</p>
            </article>
            <article class="card">
              <p class="eyebrow">Meaning</p>
              <h2>Choose the correct meaning.</h2>
              <div class="answer-grid" style="grid-template-columns: repeat(2, 1fr); width: 100%;">
                <button v-for="answer in vocabularyOptions" :key="answer" class="answer-button" :class="{ selected: selectedVocabularyAnswer === answer, correct: vocabularyFeedback === 'correct' && answer === activeVocabularyItem.meaning, incorrect: vocabularyFeedback === 'incorrect' && selectedVocabularyAnswer === answer }" @click="selectedVocabularyAnswer = answer">{{ answer }}</button>
              </div>
              <button class="primary-button" style="margin-top: 1.5rem;" :disabled="!selectedVocabularyAnswer" @click="nextVocabularyItem($event)">
                {{ vocabularyFeedback === 'correct' ? 'Next Word' : 'Check' }} <Icon name="material-symbols:arrow-forward" />
              </button>
              <Transition name="soft-appear">
                <p v-if="vocabularyFeedback !== 'idle'" :class="['feedback-text', vocabularyFeedback]">
                  {{ vocabularyFeedback === 'correct' ? 'Correct.' : `Not quite. ${activeVocabularyItem.term} means ${activeVocabularyItem.meaning}.` }}
                </p>
              </Transition>
            </article>
          </section>
        </template>
      </div>

      <div v-else-if="currentView === 'creator'" class="creator-layout">
        <section class="creator-canvas section-stack">
          <section class="card creator-course-picker">
            <label class="eyebrow" for="creator-course-select">Course Draft</label>
            <Select input-id="creator-course-select" :model-value="creatorDraft.id" :options="creatorDrafts" option-label="title" option-value="id" @update:model-value="selectCreatorDraft($event)" />
            <button class="secondary-button" @click="createCreatorDraft"><Icon name="material-symbols:add" /> New Course</button>
          </section>

          <section class="card creator-meta-editor">
            <div>
              <p class="eyebrow">Course Editor <span class="tag">Draft</span></p>
              <label class="creator-field-label" for="creator-course-title">Course Title</label>
              <input id="creator-course-title" v-model="creatorDraft.title" class="title-input" aria-label="Course title" />
              <label class="creator-field-label" for="creator-course-description">Course Description</label>
              <textarea id="creator-course-description" v-model="creatorDraft.description" class="description-input" aria-label="Course description" />
              <div class="field-grid language-select-grid">
                <label><span class="eyebrow">Source Language</span>
                  <Select v-model="creatorDraft.sourceLanguage" :options="courseLanguageOptions" option-label="label" option-value="value">
                    <template #value="slotProps">
                      <span class="language-option"><Icon :name="selectedLanguageOption(slotProps.value)?.flag || languageFlagIcon(String(slotProps.value || ''))" /> {{ selectedLanguageOption(slotProps.value)?.label || languageLabel(String(slotProps.value || '')) }}</span>
                    </template>
                    <template #option="slotProps">
                      <span class="language-option"><Icon :name="slotProps.option.flag" /> {{ slotProps.option.label }}</span>
                    </template>
                  </Select>
                </label>
                <label><span class="eyebrow">Target Language</span>
                  <Select v-model="creatorDraft.targetLanguage" :options="courseLanguageOptions" option-label="label" option-value="value">
                    <template #value="slotProps">
                      <span class="language-option"><Icon :name="selectedLanguageOption(slotProps.value)?.flag || languageFlagIcon(String(slotProps.value || ''))" /> {{ selectedLanguageOption(slotProps.value)?.label || languageLabel(String(slotProps.value || '')) }}</span>
                    </template>
                    <template #option="slotProps">
                      <span class="language-option"><Icon :name="slotProps.option.flag" /> {{ slotProps.option.label }}</span>
                    </template>
                  </Select>
                </label>
              </div>
            </div>
            <div class="creator-action-bar">
              <button class="primary-button" @click="addCreatorDraftToCourses"><Icon name="material-symbols:playlist-add" /> {{ isCreatorDraftAdded ? 'Update My Course' : 'Add to My Courses' }}</button>
              <button class="secondary-button" :disabled="!isCreatorDraftAdded" @click="openCourse(courses.find(course => course.id === creatorDraft.id) || draftToCourseSummary(buildDraftSnapshot()), 'map')"><Icon name="material-symbols:route" /> Test Play</button>
              <button class="secondary-button" @click="showJsonView = !showJsonView"><Icon name="material-symbols:data-object" /> JSON View</button>
              <button class="secondary-button" @click="saveDraft">Save Draft</button>
              <label class="secondary-button file-button">
                <Icon name="material-symbols:upload-file" /> Import Course
                <input type="file" accept="application/json" class="sr-only" @change="importCourseDraft" />
              </label>
              <button class="primary-button" @click="exportCourse"><Icon name="material-symbols:publish" /> Export Course</button>
            </div>
          </section>

          <pre v-if="showJsonView" class="json-panel">{{ creatorJson }}</pre>

          <section class="card creator-lesson-list">
            <div class="action-row" style="justify-content: space-between;">
              <h2>Lessons</h2>
              <button class="primary-button" @click="addCreatorLesson"><Icon name="material-symbols:add" /> Add Lesson</button>
            </div>
            <div class="lesson-tabs">
              <button v-for="(lesson, index) in creatorLessons" :key="lesson.id" class="secondary-button" :class="{ selected: lesson.id === selectedCreatorLessonId }" @click="selectedCreatorLessonId = lesson.id">
                Lesson {{ index + 1 }} · {{ lesson.title }}
              </button>
            </div>
          </section>

          <div class="editor-grid">
            <article v-if="selectedCreatorLesson" class="card card-accent" style="--accent: var(--zs-primary);">
              <div class="action-row" style="justify-content: space-between; align-items: flex-start;">
                <h2><Icon name="material-symbols:menu-book" class="success-icon" /> Lesson Editor</h2>
                <button class="ghost-button danger-button" @click="removeCreatorLesson(selectedCreatorLesson.id)"><Icon name="material-symbols:delete" /> Remove</button>
              </div>
              <label class="eyebrow" for="creator-lesson-title">Lesson Title</label>
              <input id="creator-lesson-title" v-model="selectedCreatorLesson.title" class="input" />
              <label class="eyebrow" for="lesson-explanation" style="margin-top: 1rem;">Explanation Text</label>
              <textarea id="lesson-explanation" v-model="selectedCreatorLesson.explanation" class="textarea" />
            </article>
            <article v-if="selectedCreatorLesson" class="card card-accent" style="--accent: var(--zs-primary);">
              <h2><Icon name="material-symbols:translate" /> Target Vocab</h2>
              <div class="section-stack" style="gap: .75rem;">
                <span v-for="word in selectedCreatorLesson.words" :key="word" class="tag cjk word-chip">{{ word }} <span class="muted">target word</span><button class="chip-remove" :aria-label="`Remove ${word}`" @click="removeWord(word)">×</button></span>
                <div class="inline-form">
                  <input v-model="newWord" class="input" placeholder="New vocabulary" @keydown.enter.prevent="addWord" />
                  <button class="secondary-button" @click="addWord"><Icon name="material-symbols:add" /> Add Word</button>
                </div>
              </div>
            </article>
          </div>

          <article v-if="selectedCreatorLesson" class="card card-accent" style="--accent: var(--zs-primary);">
            <div class="action-row" style="justify-content: space-between;">
              <h2><Icon name="material-symbols:quiz" style="color: var(--zs-primary);" /> Practice Exercises</h2>
              <button class="secondary-button" @click="addCreatorExercise"><Icon name="material-symbols:add" /> Add Exercise</button>
            </div>
            <div class="exercise-editor-list">
              <article v-for="(exercise, index) in selectedCreatorLesson.exercises" :key="exercise.id" class="exercise-editor">
                <div class="action-row" style="justify-content: space-between;">
                  <strong>Exercise {{ index + 1 }}</strong>
                  <button class="ghost-button danger-button" @click="removeCreatorExercise(exercise.id)"><Icon name="material-symbols:delete" /> Remove</button>
                </div>
                <div class="field-grid">
                  <label><span class="eyebrow">Exercise Type</span><Select v-model="exercise.type" :options="exerciseTypeOptions" option-label="label" option-value="value" /></label>
                  <label><span class="eyebrow">Prompt / Question</span><input v-model="exercise.prompt" class="input" /></label>
                </div>
                <label><span class="eyebrow">Sentence</span><input v-model="exercise.sentence" class="input cjk" /></label>
                <div class="field-grid">
                  <label><span class="eyebrow">Alternative Reading</span><input v-model="exercise.reading" class="input cjk" placeholder="Hiragana, romaji, etc." /></label>
                  <label><span class="eyebrow">Translation</span><input v-model="exercise.translation" class="input" /></label>
                </div>
                <div v-if="exercise.type === 'fill-blank'" class="field-grid">
                  <label><span class="eyebrow">Blank Before</span><input v-model="exercise.blankBefore" class="input cjk" /></label>
                  <label><span class="eyebrow">Blank After</span><input v-model="exercise.blankAfter" class="input cjk" /></label>
                </div>
                <div v-if="exercise.type === 'sentence-order' || exercise.type === 'dialogue-order-lines'" class="type-specific-editor">
                  <div class="field-grid">
                    <label><span class="eyebrow">Available Chunks</span><input :value="exercise.chips.join(' | ')" class="input cjk" placeholder="いち | に | さん" @input="setExerciseChipsFromInput(exercise, ($event.target as HTMLInputElement).value)" /></label>
                    <label><span class="eyebrow">Correct Order</span><input :value="exercise.orderItems.join(' | ')" class="input cjk" placeholder="Chunk 1 | Chunk 2 | Chunk 3" @input="setOrderItemsFromInput(exercise, ($event.target as HTMLInputElement).value)" /></label>
                  </div>
                  <p class="muted compact-help">Learners tap available chunks into the answer area. The correct order is saved as the answer automatically.</p>
                </div>
                <div v-else class="field-grid">
                  <label><span class="eyebrow">Correct Answer</span><input v-model="exercise.answer" class="input" /></label>
                  <label><span class="eyebrow">Hint</span><input v-model="exercise.hint" class="input" /></label>
                </div>
                <label v-if="exercise.type === 'sentence-order' || exercise.type === 'dialogue-order-lines'"><span class="eyebrow">Hint</span><input v-model="exercise.hint" class="input" /></label>
                <div class="field-grid">
                  <label><span class="eyebrow">Grammar Title</span><input v-model="exercise.grammarTitle" class="input" /></label>
                  <label><span class="eyebrow">Grammar Note</span><input v-model="exercise.grammarNote" class="input" /></label>
                </div>
                <label><span class="eyebrow">Example Sentence</span><input v-model="exercise.example" class="input cjk" /></label>
                <div class="field-grid">
                  <label><span class="eyebrow">Example Reading</span><input v-model="exercise.exampleReading" class="input cjk" /></label>
                  <label><span class="eyebrow">Example Translation</span><input v-model="exercise.exampleTranslation" class="input" /></label>
                </div>
                <p v-if="exercise.type !== 'sentence-order' && exercise.type !== 'dialogue-order-lines'" class="eyebrow" style="margin-top: 1rem;">Answer Options</p>
                <div v-if="exercise.type !== 'sentence-order' && exercise.type !== 'dialogue-order-lines'" class="chip-row">
                  <span v-for="chip in exercise.chips" :key="chip" class="tag cjk">{{ chip }} <button class="chip-remove" :aria-label="`Remove ${chip}`" @click="exercise.chips = exercise.chips.filter(item => item !== chip)">×</button></span>
                  <button class="secondary-button" @click="addChipToExercise(exercise)"><Icon name="material-symbols:add" /> Option</button>
                </div>
              </article>
            </div>
          </article>
        </section>
        <aside class="creator-side section-stack">
          <h2><Icon name="material-symbols:fact-check" /> Validation</h2>
          <div class="validation-list">
            <div v-if="!creatorIssues.length" class="validation-card success-card compact-validation-card">
              <strong><Icon name="material-symbols:check-circle" /> Ready to Export</strong>
              <span class="muted">No blocking issues found.</span>
            </div>
            <div v-for="issue in creatorIssues" v-else :key="issue" class="validation-card warning compact-validation-card">
              <strong><Icon name="material-symbols:warning" /> {{ issue.includes('audio') ? 'Audio Missing' : 'Needs Attention' }}</strong>
              <span class="muted">{{ issue }}</span>
              <button v-if="issue.includes('audio')" class="ghost-button link-button compact-link" @click="attachAudio">Mark Audio Attached</button>
            </div>
          </div>
          <div class="card compact-card">
            <p class="eyebrow">Course Field Coverage</p>
            <ul class="coverage-list">
              <li v-for="item in creatorSchemaCoverage" :key="item"><Icon name="material-symbols:check-circle" /> {{ item }}</li>
            </ul>
          </div>
          <div class="card compact-card">
            <p class="eyebrow">Course Stats</p>
            <p>Total Lessons <strong style="float: right;">{{ creatorLessons.length }}</strong></p>
            <p>Total Exercises <strong style="float: right;">{{ creatorLessons.reduce((total, lesson) => total + lesson.exercises.length, 0) }}</strong></p>
            <p>Vocab Count <strong style="float: right;">{{ creatorLessons.reduce((total, lesson) => total + lesson.words.length, 0) }}</strong></p>
          </div>
        </aside>
      </div>
        </div>
      </Transition>
    </main>

    <aside v-if="showSettings" class="settings-drawer card">
      <button class="ghost-button drawer-close" aria-label="Close settings" @click="toggleSettings"><Icon name="material-symbols:close" /></button>
      <h2>{{ t('settings') }}</h2>
      <label class="settings-row">{{ t('uiLanguage') }}
        <Select :model-value="uiLanguage" :options="uiLanguageOptions" option-label="label" option-value="value" @update:model-value="setUiLanguage($event)" />
      </label>
      <label class="settings-row">{{ t('dailyXpGoal') }} <input v-model.number="profile.dailyGoal" class="input" type="number" min="10" step="10" @change="database.saveProfile(profile)" /></label>
      <button class="primary-button" @click="database.saveProfile(profile); showToast('Settings saved', 'success')"><Icon name="material-symbols:save" /> {{ t('saveSettings') }}</button>
    </aside>

    <div class="toast-stack" aria-live="polite">
      <div v-for="toast in toastMessages" :key="toast.id" :class="['toast', toast.tone]">
        <Icon :name="toast.tone === 'success' ? 'material-symbols:check-circle' : toast.tone === 'warning' ? 'material-symbols:warning' : 'material-symbols:info'" />
        {{ toast.message }}
      </div>
    </div>
    <div class="xp-particle-layer" aria-hidden="true">
      <span
        v-for="particle in xpParticles"
        :key="particle.id"
        class="xp-particle"
        :style="{
          left: `${particle.x}px`,
          top: `${particle.y}px`,
          '--xp-start-x': `${particle.x}px`,
          '--xp-start-y': `${particle.y}px`,
          '--xp-burst-x': `${particle.burstX}px`,
          '--xp-burst-y': `${particle.burstY}px`,
          '--xp-x-35': `${particle.x35}px`,
          '--xp-y-35': `${particle.y35}px`,
          '--xp-x-72': `${particle.x72}px`,
          '--xp-y-72': `${particle.y72}px`,
          '--xp-end-x': `${particle.endX}px`,
          '--xp-end-y': `${particle.endY}px`,
          '--xp-angle': `${particle.angle}deg`,
          '--xp-delay': `${particle.delay}ms`,
          '--xp-size': `${particle.size}rem`
        }"
      />
    </div>
  </div>
  </Transition>
</template>