<script setup lang="ts">
import type { CourseSummary, CreatorDraft, Profile, RepositoryRecord } from './composables/useZenStudyDatabase'

type ViewName = 'dashboard' | 'repository' | 'map' | 'lesson' | 'characters' | 'vocabulary' | 'dialogues' | 'creator' | 'profile'
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
  type: 'learn' | 'fill-blank' | 'translate' | 'choice' | 'sentence-order'
  prompt: string
  sentence: string
  illustration?: string
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

type DialogueLine = {
  speaker: string
  text: string
  translation?: string
  answerOptions?: string[]
  correctAnswer?: string
}

type CourseDialogue = {
  id: string
  lessonId: string
  title: string
  context: string
  speakerA: string
  speakerB: string
  learnerRole: string
  lines: DialogueLine[]
}

type CharacterPrompt = {
  character: string
  answers: string[]
  correctAnswer: string
}

type CharacterTable = {
  id: string
  title: string
  description: string
  characters: string[]
  prompts?: CharacterPrompt[]
}

type VocabularyItem = {
  id: string
  term: string
  reading?: string
  meaning: string
  example?: string
}

type CreatorWord = {
  id: string
  term: string
  example: string
}

type CreatorCharacterTable = {
  id: string
  title: string
  description: string
  characters: string[]
  prompts: CharacterPrompt[]
}

type BadgeDefinition = { id: BadgeId, labelKey: UiCopyKey, descriptionKey: UiCopyKey, icon: string }

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
  characterPrompt?: CharacterPrompt
  characterTables?: CharacterTable[]
  characters: string[]
  vocabulary: VocabularyItem[]
  dialogues: CourseDialogue[]
  lessons: CourseLesson[]
}

type CreatorExercise = {
  id: string
  type: LessonExercise['type']
  prompt: string
  sentence: string
  illustration: string
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

type CreatorDialogue = {
  id: string
  title: string
  context: string
  speakerA: string
  speakerB: string
  learnerRole: string
  lines: DialogueLine[]
}

type CreatorLesson = {
  id: string
  title: string
  explanation: string
  words: CreatorWord[]
  exercises: CreatorExercise[]
  dialogues: CreatorDialogue[]
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
const characterTableIndex = ref(0)
const randomCharacterPractice = ref(false)
const vocabularyIndex = ref(0)
const dialoguePracticeIndex = ref(0)
const dialogueQuestionIndex = ref(0)
const selectedDialogueAnswer = ref('')
const dialogueFeedback = ref<LessonState>('idle')
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
const exerciseTypeDefinitions = [
  { labelKey: 'typeLearnCard', value: 'learn' },
  { labelKey: 'typeChoice', value: 'choice' },
  { labelKey: 'typeTranslate', value: 'translate' },
  { labelKey: 'typeFillBlank', value: 'fill-blank' },
  { labelKey: 'typeSentenceOrder', value: 'sentence-order' }
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
  badges: [],
  practiceStats: {
    coursesAdded: 0,
    lessonsCompleted: 0,
    vocabularyCorrect: 0,
    characterCorrect: 0,
    creatorCourses: 0,
    dialogueExercisesCreated: 0
  }
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
const selectedCreatorCharacterTableId = ref('table-hiragana-vowels')
const characterTableCharacterInput = ref('')
const creatorCharacterTables = ref<CreatorCharacterTable[]>([
  {
    id: 'table-hiragana-vowels',
    title: 'Hiragana Vowels',
    description: 'Practice the first vowel row.',
    characters: ['あ', 'い', 'う', 'え', 'お'],
    prompts: [
      { character: 'あ', answers: ['a', 'i', 'u'], correctAnswer: 'a' },
      { character: 'い', answers: ['i', 'a', 'e'], correctAnswer: 'i' },
      { character: 'う', answers: ['u', 'o', 'a'], correctAnswer: 'u' },
      { character: 'え', answers: ['e', 'i', 'o'], correctAnswer: 'e' },
      { character: 'お', answers: ['o', 'u', 'a'], correctAnswer: 'o' }
    ]
  }
])

const creatorLessons = ref<CreatorLesson[]>([
  {
    id: 'lesson-conditional-ba',
    title: 'Conditional Form (〜ば)',
    explanation: 'The 〜ば form is used to express conditionals. It translates roughly to "if" or "provided that".',
    words: [
      { id: 'word-taberu', term: '食べる', example: '朝ごはんを食べます。' },
      { id: 'word-iku', term: '行く', example: '学校に行きます。' }
    ],
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
    ],
    dialogues: [
      {
        id: 'dialogue-cafe-counter',
        title: 'Cafe Counter Request',
        context: 'A learner orders a drink at a cafe counter.',
        speakerA: 'Staff',
        speakerB: 'Customer',
        learnerRole: 'Customer',
        lines: [
          { speaker: 'Staff', text: 'いらっしゃいませ。', translation: 'Welcome.' },
          { speaker: 'Customer', text: 'コーヒーをください。', translation: 'Coffee, please.', answerOptions: ['コーヒーをください。', '水をください。', 'すみません。'], correctAnswer: 'コーヒーをください。' },
          { speaker: 'Staff', text: 'ほかにご注文はありますか。', translation: 'Would you like anything else?' },
          { speaker: 'Customer', text: 'いいえ、以上です。', translation: 'No, that is all.', answerOptions: ['いいえ、以上です。', 'はい、どうぞ。', 'こんにちは。'], correctAnswer: 'いいえ、以上です。' }
        ]
      }
    ]
  }
])
const selectedCreatorLessonId = ref('lesson-conditional-ba')
const selectedCreatorExerciseId = ref('exercise-ba-choice')
const selectedCreatorDialogueId = ref('dialogue-cafe-counter')

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
    noVocabularyYet: 'No Vocabulary Yet', trainWordsFromCourse: 'Train words from your added course data.', practiceCharactersFromCourse: 'Practice writing-system tables from added course data.', practiceDialoguesFromCourse: 'Practice dialogue scenes from your added course data.', fromLanguage: 'from', noLocalCoursesYet: 'No local courses yet', addCourseFromRepository: 'Add a course from the repository to start learning.', progress: 'Progress', practice: 'Practice', continueCourse: 'Continue', of: 'of', xpEarnedToday: 'XP earned today', browseCourses: 'Browse Courses', characterTablePractice: 'Character Table Practice', noCharacterTables: 'No Character Tables Added', addCharacterCourse: 'Add a course with character-table content before practicing characters.', prompt: 'Prompt', chooseReadingFor: 'Choose the reading for', check: 'Check', correct: 'Correct.', notQuite: 'Not quite.', addCourseBeforeVocab: 'Add a course before training vocabulary.', addCourseBeforeDialogues: 'Add a course before practicing dialogues.', noCourseVocabulary: 'This course does not expose vocabulary items yet.', noCourseDialogues: 'This course does not expose dialogue scenes yet.', addWordsInCreator: 'Add Words in Creator', addDialoguesInCreator: 'Add Dialogues in Creator', term: 'Term', chooseCorrectMeaning: 'Choose the correct meaning.', nextWord: 'Next Word', nextDialogue: 'Next Dialogue', localCourse: 'local course', localCourses: 'local courses', courseSingular: 'course', coursePlural: 'courses', wordsUnit: 'words', sentencesUnit: 'sentences', dialoguesUnit: 'dialogues', tablesUnit: 'tables', noVisibleCourses: 'No visible courses', tryDisablingNonAddedFilter: 'Try disabling the non-added filter.', completed: 'Completed', play: 'Play', start: 'Start', repositoryUrlConfigured: 'repository URL configured', repositoryUrlsConfigured: 'repository URLs configured', coursesLoadedBundled: 'courses loaded from bundled example repository', coursesLoadedRepository: 'courses loaded from repository', repositorySavedLocally: 'Repository saved locally', fetching: 'Fetching', exampleRepositoryLoaded: 'Example repository loaded', brandSubtitle: 'Local-first Learning', localFirstCompatible: 'Local-first / IndexedDB compatible', repositoryUrlLabel: 'Repository URL', repositoryUrlPlaceholder: 'Repository server URL', selectBestAnswer: 'Select the best answer.', hideReading: 'Hide reading', showReading: 'Show reading', revealMeaningReady: 'Reveal the meaning when you are ready.', revealMeaning: 'Reveal Meaning', reveal: 'Reveal', tryAgain: 'Try again', correctAnswerLabel: 'Correct answer', tapChunksInOrder: 'Tap chunks in order.', checkToReveal: 'Check to reveal', revealUnlocks: 'Notes, examples, and reading hints unlock after your answer.', grammarNoteLabel: 'Grammar Note', readingHint: 'Reading hint', particleHint: 'When は is used as a particle, it is pronounced “wa”.', profile: 'Profile', runningCourses: 'Running Courses', noCoursesInProgress: 'No courses in progress.', completedCourses: 'Completed Courses', completedCoursesAppear: 'Completed courses will appear here.', lessonsCompleted: 'lessons completed', badgesEmpty: 'Badges earned through repositories, lessons, and practice will show here.', dialogues: 'Dialogues', dialoguePractice: 'Dialogue Practice', addDialogue: 'Add Dialogue', dialogueLabel: 'Dialogue', selectedDialogue: 'Selected Dialogue', dialogueTitle: 'Dialogue Title', dialogueTurns: 'turns', noDialoguesYet: 'No dialogues yet', addDialogueToLesson: 'Add a dialogue to this lesson.', moveDialogueUp: 'Move dialogue up', moveDialogueDown: 'Move dialogue down', dialogueScene: 'Dialogue Scene', dialogueParticipants: 'Dialogue Participants', speakerA: 'Speaker A', speakerB: 'Speaker B', learnerRole: 'Learner Role', dialogueLines: 'Dialogue Lines', dialogueLinesHelp: 'One line per turn. Use “Speaker: text | translation”.', responsePromptLine: 'Prompt Line', badgeFirstRepository: 'First Repository', badgeLessonBuilder: 'Lesson Builder', badgeVocabStarter: 'Vocabulary Spark', badgeKanaStarter: 'Kana Starter', badgeCourseFinisher: 'Course Finisher', badgeDialogueMaker: 'Dialogue Maker', badgeStreakKeeper: 'Streak Keeper', badgeFirstRepositoryDescription: 'Add your first repository course.', badgeLessonBuilderDescription: 'Complete your first lesson.', badgeVocabStarterDescription: 'Answer a vocabulary prompt correctly.', badgeKanaStarterDescription: 'Answer a character-table prompt correctly.', badgeCourseFinisherDescription: 'Finish every lesson in a course.', badgeDialogueMakerDescription: 'Create a course with dialogue practice.', badgeStreakKeeperDescription: 'Keep a learning streak alive.', isReadAs: 'is read as', tryAgainCharacterReading: 'Try again:', xpEarnedToastLabel: 'earned', repositoryUrlRequired: 'Enter a repository URL first.', courseSavedToIndexedDb: 'saved to IndexedDB', addCourseBeforeLessons: 'Add a course before starting lessons.', courseRemovedLocal: 'Course removed from local library', libraryJsonExported: 'Library JSON exported', coursesImported: 'courses imported', importFailed: 'Import failed. Please choose a ZenStudy JSON file.', draftSavedLocally: 'Draft saved locally', courseUpdatedInMyCourses: 'updated in My Courses', courseAddedInMyCourses: 'added in My Courses', courseJsonExported: 'Course JSON exported', draftImportFailed: 'Draft import failed. Please choose a course JSON file.', courseNeedsLesson: 'A course needs at least one lesson.', lessonNeedsExercise: 'A lesson needs at least one exercise.', audioRequirementComplete: 'Audio requirement marked complete', cardRevealed: 'Card revealed.', chooseAnswerFirst: 'Choose an answer first.', settingsSaved: 'Settings saved', addCharacter: 'Add Character', characterPlaceholder: 'Type one or more characters, separated by spaces or new lines.', charactersHelp: 'Add as many characters as you need. Separate them with spaces or new lines.',
    courseDraft: 'Course Draft', newCourse: 'New Course', courseEditor: 'Course Editor', draft: 'Draft', courseTitle: 'Course Title', courseDescription: 'Course Description', sourceLanguage: 'Source Language', targetLanguage: 'Target Language', updateMyCourse: 'Update My Course', addToMyCourses: 'Add to My Courses', testPlay: 'Test Play', jsonView: 'JSON View', saveDraft: 'Save Draft', importCourse: 'Import Course', exportCourse: 'Export Course', lessons: 'Lessons', addLesson: 'Add Lesson', lessonLabel: 'Lesson', lessonEditor: 'Lesson Editor', lessonTitle: 'Lesson Title', explanationText: 'Explanation Text', targetVocab: 'Target Vocab', word: 'Word', exampleSentence: 'Example Sentence', newVocabulary: 'New vocabulary', addWord: 'Add Word', practiceExercises: 'Practice Exercises', addExercise: 'Add Exercise', exerciseLabel: 'Exercise', selectedExercise: 'Selected Exercise', exerciseType: 'Exercise Type', promptQuestion: 'Prompt / Question', wordPhrase: 'Word / Phrase', sentence: 'Sentence', illustration: 'Illustration', illustrationPlaceholder: 'Emoji, icon text, or image URL', meaning: 'Meaning', alternativeReading: 'Alternative Reading', readingPlaceholder: 'Hiragana, romaji, etc.', translation: 'Translation', blankBefore: 'Blank Before', blankAfter: 'Blank After', availableChunks: 'Available Chunks', chunksPlaceholder: 'Chunk 1 | Chunk 2 | Chunk 3', correctOrder: 'Correct Order', orderHelp: 'Learners tap available chunks into the answer area. The correct order is saved as the answer automatically.', correctAnswer: 'Correct Answer', hint: 'Hint', grammarTitle: 'Grammar Title', grammarNote: 'Grammar Note', exampleReading: 'Example Reading', exampleTranslation: 'Example Translation', answerOptions: 'Answer Options', option: 'Option', validation: 'Validation', readyToExport: 'Ready to Export', noBlockingIssues: 'No blocking issues found.', markAudioAttached: 'Mark Audio Attached', courseFieldCoverage: 'Course Field Coverage', courseStats: 'Course Stats', totalLessons: 'Total Lessons', totalExercises: 'Total Exercises', totalDialogues: 'Total Dialogues', vocabCount: 'Vocab Count', moveExerciseUp: 'Move exercise up', moveExerciseDown: 'Move exercise down', audioMissing: 'Audio Missing', needsAttention: 'Needs Attention', titleDescriptionRequired: 'Title and description are required.', oneLessonRequired: 'At least one lesson is required.', lessonExerciseRequired: 'Every lesson needs at least one exercise.', nativeAudioMissing: 'Exercise 1 lacks native audio pronunciation.', coverageCoreFields: 'Prompt, type, sentence, translation', coverageReadings: 'Alternative and example readings', coverageBlankText: 'Fill-blank before/after text', coverageAnswerOptions: 'Answer options/chips and correct answer', coverageGrammarExamples: 'Hints, grammar notes, examples', coverageDialogues: 'Dedicated dialogue scenes and turns', typeLearnCard: 'Learn Card', typeChoice: 'Choice', typeTranslate: 'Translate', typeFillBlank: 'Fill Blank', typeSentenceOrder: 'Sentence Order'
  },
  de: {
    dashboard: 'Übersicht', courses: 'Kurse', courseMap: 'Kurskarte', characters: 'Zeichen', vocabulary: 'Vokabeln', creator: 'Editor',
    settings: 'Einstellungen', online: 'Online', offlineMode: 'Offline-Modus', welcomeBack: 'Willkommen zurück,', activeCourses: 'Aktive Kurse',
    dailyGoal: 'Tagesziel', recentAchievements: 'Erfolge', dayStreak: 'Tage-Serie', level: 'Level', xpToNext: 'XP bis zum nächsten Level',
    repository: 'Kurs-Repository', importJson: 'JSON importieren', exportLibrary: 'Bibliothek exportieren', fetch: 'Laden', addAll: 'Alle verfügbaren hinzufügen',
    showOnlyNonAdded: 'Nur nicht hinzugefügte zeigen', view: 'Ansehen', add: 'Hinzufügen', remove: 'Entfernen', downloaded: 'Heruntergeladen', available: 'Verfügbar',
    dailyXpGoal: 'Tägliches XP-Ziel', uiLanguage: 'UI-Sprache', saveSettings: 'Einstellungen speichern', vocabularyPractice: 'Vokabeltraining',
    randomPractice: 'Zufälliges Training', sequentialPractice: 'Training der Reihe nach', random: 'Zufällig', noAddedCourse: 'Kein Kurs hinzugefügt',
    noVocabularyYet: 'Noch keine Vokabeln', trainWordsFromCourse: 'Trainiere Wörter aus deinen hinzugefügten Kursdaten.', practiceCharactersFromCourse: 'Übe Zeichentabellen aus deinen hinzugefügten Kursdaten.', practiceDialoguesFromCourse: 'Übe Dialogszenen aus deinen hinzugefügten Kursdaten.', fromLanguage: 'aus', noLocalCoursesYet: 'Noch keine lokalen Kurse', addCourseFromRepository: 'Füge einen Kurs aus dem Repository hinzu, um zu lernen.', progress: 'Fortschritt', practice: 'Üben', continueCourse: 'Fortsetzen', of: 'von', xpEarnedToday: 'XP heute verdient', browseCourses: 'Kurse durchsuchen', characterTablePractice: 'Zeichentabellen üben', noCharacterTables: 'Keine Zeichentabellen hinzugefügt', addCharacterCourse: 'Füge einen Kurs mit Zeichentabellen hinzu, bevor du Zeichen übst.', prompt: 'Aufgabe', chooseReadingFor: 'Wähle die Lesung für', check: 'Prüfen', correct: 'Richtig.', notQuite: 'Nicht ganz.', addCourseBeforeVocab: 'Füge einen Kurs hinzu, bevor du Vokabeln trainierst.', addCourseBeforeDialogues: 'Füge einen Kurs hinzu, bevor du Dialoge übst.', noCourseVocabulary: 'Dieser Kurs stellt noch keine Vokabeln bereit.', noCourseDialogues: 'Dieser Kurs stellt noch keine Dialogszenen bereit.', addWordsInCreator: 'Wörter im Editor hinzufügen', addDialoguesInCreator: 'Dialoge im Editor hinzufügen', term: 'Begriff', chooseCorrectMeaning: 'Wähle die richtige Bedeutung.', nextWord: 'Nächstes Wort', nextDialogue: 'Nächster Dialog', localCourse: 'lokaler Kurs', localCourses: 'lokale Kurse', courseSingular: 'Kurs', coursePlural: 'Kurse', wordsUnit: 'Wörter', sentencesUnit: 'Sätze', dialoguesUnit: 'Dialoge', tablesUnit: 'Tabellen', noVisibleCourses: 'Keine sichtbaren Kurse', tryDisablingNonAddedFilter: 'Deaktiviere den Filter für nicht hinzugefügte Kurse.', completed: 'Abgeschlossen', play: 'Starten', start: 'Starten', repositoryUrlConfigured: 'Repository-URL konfiguriert', repositoryUrlsConfigured: 'Repository-URLs konfiguriert', coursesLoadedBundled: 'Kurse aus dem gebündelten Beispiel-Repository geladen', coursesLoadedRepository: 'Kurse aus dem Repository geladen', repositorySavedLocally: 'Repository lokal gespeichert', fetching: 'Lade', exampleRepositoryLoaded: 'Beispiel-Repository geladen', brandSubtitle: 'Lokal zuerst lernen', localFirstCompatible: 'Lokal zuerst / IndexedDB-kompatibel', repositoryUrlLabel: 'Repository-URL', repositoryUrlPlaceholder: 'Repository-Server-URL', selectBestAnswer: 'Wähle die beste Antwort.', hideReading: 'Lesung ausblenden', showReading: 'Lesung anzeigen', revealMeaningReady: 'Zeige die Bedeutung, wenn du bereit bist.', revealMeaning: 'Bedeutung anzeigen', reveal: 'Anzeigen', tryAgain: 'Erneut versuchen', correctAnswerLabel: 'Richtige Antwort', tapChunksInOrder: 'Tippe die Teile in der richtigen Reihenfolge an.', checkToReveal: 'Prüfen zum Anzeigen', revealUnlocks: 'Notizen, Beispiele und Lesehinweise werden nach deiner Antwort freigeschaltet.', grammarNoteLabel: 'Grammatiknotiz', readingHint: 'Lesehinweis', particleHint: 'Wenn は als Partikel verwendet wird, spricht man es „wa“ aus.', profile: 'Profil', runningCourses: 'Laufende Kurse', noCoursesInProgress: 'Keine Kurse in Bearbeitung.', completedCourses: 'Abgeschlossene Kurse', completedCoursesAppear: 'Abgeschlossene Kurse werden hier angezeigt.', lessonsCompleted: 'Lektionen abgeschlossen', badgesEmpty: 'Abzeichen aus Repositories, Lektionen und Übungen werden hier angezeigt.', dialogues: 'Dialoge', dialoguePractice: 'Dialogtraining', addDialogue: 'Dialog hinzufügen', dialogueLabel: 'Dialog', selectedDialogue: 'Ausgewählter Dialog', dialogueTitle: 'Dialogtitel', dialogueTurns: 'Beiträge', noDialoguesYet: 'Noch keine Dialoge', addDialogueToLesson: 'Füge dieser Lektion einen Dialog hinzu.', moveDialogueUp: 'Dialog nach oben verschieben', moveDialogueDown: 'Dialog nach unten verschieben', dialogueScene: 'Dialogsituation', dialogueParticipants: 'Dialogteilnehmer', speakerA: 'Sprecher A', speakerB: 'Sprecher B', learnerRole: 'Rolle der Lernenden', dialogueLines: 'Dialogzeilen', dialogueLinesHelp: 'Eine Zeile pro Beitrag. Nutze „Sprecher: Text | Übersetzung“.', responsePromptLine: 'Ausgangszeile', badgeFirstRepository: 'Erstes Repository', badgeLessonBuilder: 'Lektionsstarter', badgeVocabStarter: 'Vokabelfunke', badgeKanaStarter: 'Kana-Starter', badgeCourseFinisher: 'Kurs abgeschlossen', badgeDialogueMaker: 'Dialogmacher', badgeStreakKeeper: 'Serienhüter', badgeFirstRepositoryDescription: 'Füge deinen ersten Repository-Kurs hinzu.', badgeLessonBuilderDescription: 'Schließe deine erste Lektion ab.', badgeVocabStarterDescription: 'Beantworte eine Vokabelaufgabe richtig.', badgeKanaStarterDescription: 'Beantworte eine Zeichentabellen-Aufgabe richtig.', badgeCourseFinisherDescription: 'Schließe jede Lektion eines Kurses ab.', badgeDialogueMakerDescription: 'Erstelle einen Kurs mit Dialogtraining.', badgeStreakKeeperDescription: 'Halte eine Lernserie am Leben.', isReadAs: 'wird gelesen als', tryAgainCharacterReading: 'Versuch es erneut:', xpEarnedToastLabel: 'verdient', repositoryUrlRequired: 'Gib zuerst eine Repository-URL ein.', courseSavedToIndexedDb: 'in IndexedDB gespeichert', addCourseBeforeLessons: 'Füge einen Kurs hinzu, bevor du Lektionen startest.', courseRemovedLocal: 'Kurs aus der lokalen Bibliothek entfernt', libraryJsonExported: 'Bibliotheks-JSON exportiert', coursesImported: 'Kurse importiert', importFailed: 'Import fehlgeschlagen. Wähle eine ZenStudy-JSON-Datei.', draftSavedLocally: 'Entwurf lokal gespeichert', courseUpdatedInMyCourses: 'in Meine Kurse aktualisiert', courseAddedInMyCourses: 'zu Meine Kurse hinzugefügt', courseJsonExported: 'Kurs-JSON exportiert', draftImportFailed: 'Entwurfimport fehlgeschlagen. Wähle eine Kurs-JSON-Datei.', courseNeedsLesson: 'Ein Kurs braucht mindestens eine Lektion.', lessonNeedsExercise: 'Eine Lektion braucht mindestens eine Übung.', audioRequirementComplete: 'Audio-Anforderung als erledigt markiert', cardRevealed: 'Karte angezeigt.', chooseAnswerFirst: 'Wähle zuerst eine Antwort.', settingsSaved: 'Einstellungen gespeichert', addCharacter: 'Zeichen hinzufügen', characterPlaceholder: 'Gib ein oder mehrere Zeichen ein, getrennt durch Leerzeichen oder neue Zeilen.', charactersHelp: 'Füge so viele Zeichen hinzu, wie du brauchst. Trenne sie mit Leerzeichen oder neuen Zeilen.',
    courseDraft: 'Kursentwurf', newCourse: 'Neuer Kurs', courseEditor: 'Kurseditor', draft: 'Entwurf', courseTitle: 'Kurstitel', courseDescription: 'Kursbeschreibung', sourceLanguage: 'Ausgangssprache', targetLanguage: 'Zielsprache', updateMyCourse: 'Meinen Kurs aktualisieren', addToMyCourses: 'Zu meinen Kursen hinzufügen', testPlay: 'Testlauf', jsonView: 'JSON-Ansicht', saveDraft: 'Entwurf speichern', importCourse: 'Kurs importieren', exportCourse: 'Kurs exportieren', lessons: 'Lektionen', addLesson: 'Lektion hinzufügen', lessonLabel: 'Lektion', lessonEditor: 'Lektionseditor', lessonTitle: 'Lektionstitel', explanationText: 'Erklärungstext', targetVocab: 'Zielvokabeln', word: 'Wort', exampleSentence: 'Beispielsatz', newVocabulary: 'Neue Vokabel', addWord: 'Wort hinzufügen', practiceExercises: 'Übungen', addExercise: 'Übung hinzufügen', exerciseLabel: 'Übung', selectedExercise: 'Ausgewählte Übung', exerciseType: 'Übungstyp', promptQuestion: 'Aufgabe / Frage', wordPhrase: 'Wort / Ausdruck', sentence: 'Satz', illustration: 'Illustration', illustrationPlaceholder: 'Emoji, Icon-Text oder Bild-URL', meaning: 'Bedeutung', alternativeReading: 'Alternative Lesung', readingPlaceholder: 'Hiragana, Romaji usw.', translation: 'Übersetzung', blankBefore: 'Text vor der Lücke', blankAfter: 'Text nach der Lücke', availableChunks: 'Verfügbare Teile', chunksPlaceholder: 'Teil 1 | Teil 2 | Teil 3', correctOrder: 'Richtige Reihenfolge', orderHelp: 'Lernende tippen verfügbare Teile in den Antwortbereich. Die richtige Reihenfolge wird automatisch als Antwort gespeichert.', correctAnswer: 'Richtige Antwort', hint: 'Hinweis', grammarTitle: 'Grammatiktitel', grammarNote: 'Grammatiknotiz', exampleReading: 'Beispiellesung', exampleTranslation: 'Beispielübersetzung', answerOptions: 'Antwortoptionen', option: 'Option', validation: 'Validierung', readyToExport: 'Bereit zum Export', noBlockingIssues: 'Keine blockierenden Probleme gefunden.', markAudioAttached: 'Audio als angehängt markieren', courseFieldCoverage: 'Abgedeckte Kursfelder', courseStats: 'Kursstatistik', totalLessons: 'Lektionen gesamt', totalExercises: 'Übungen gesamt', totalDialogues: 'Dialoge gesamt', vocabCount: 'Vokabelanzahl', moveExerciseUp: 'Übung nach oben verschieben', moveExerciseDown: 'Übung nach unten verschieben', audioMissing: 'Audio fehlt', needsAttention: 'Benötigt Aufmerksamkeit', titleDescriptionRequired: 'Titel und Beschreibung sind erforderlich.', oneLessonRequired: 'Mindestens eine Lektion ist erforderlich.', lessonExerciseRequired: 'Jede Lektion braucht mindestens eine Übung.', nativeAudioMissing: 'Übung 1 hat keine native Audio-Aussprache.', coverageCoreFields: 'Aufgabe, Typ, Satz, Übersetzung', coverageReadings: 'Alternative Lesungen und Beispiellesungen', coverageBlankText: 'Text vor und nach der Lücke', coverageAnswerOptions: 'Antwortoptionen, Chips und richtige Antwort', coverageGrammarExamples: 'Hinweise, Grammatiknotizen, Beispiele', coverageDialogues: 'Eigene Dialogszenen und Beiträge', typeLearnCard: 'Lernkarte', typeChoice: 'Auswahl', typeTranslate: 'Übersetzen', typeFillBlank: 'Lücke füllen', typeSentenceOrder: 'Satzreihenfolge'
  },
  ja: {
    dashboard: 'ダッシュボード', courses: 'コース', courseMap: 'コースマップ', characters: '文字', vocabulary: '語彙', creator: '作成',
    settings: '設定', online: 'オンライン', offlineMode: 'オフライン', welcomeBack: 'おかえりなさい、', activeCourses: '学習中のコース',
    dailyGoal: '今日の目標', recentAchievements: '最近の実績', dayStreak: '連続日数', level: 'レベル', xpToNext: '次のレベルまでのXP',
    repository: 'コースリポジトリ', importJson: 'JSON読み込み', exportLibrary: 'ライブラリ書き出し', fetch: '取得', addAll: '利用可能なものをすべて追加',
    showOnlyNonAdded: '未追加のみ表示', view: '表示', add: '追加', remove: '削除', downloaded: '保存済み', available: '利用可能',
    dailyXpGoal: '1日のXP目標', uiLanguage: 'UI言語', saveSettings: '設定を保存', vocabularyPractice: '語彙練習',
    randomPractice: 'ランダム練習', sequentialPractice: '順番に練習', random: 'ランダム', noAddedCourse: '追加されたコースがありません',
    noVocabularyYet: '語彙がまだありません', trainWordsFromCourse: '追加したコースデータの単語を練習します。', practiceCharactersFromCourse: '追加したコースデータの文字表を練習します。', practiceDialoguesFromCourse: '追加したコースデータの会話シーンを練習します。', fromLanguage: 'から', noLocalCoursesYet: 'ローカルコースはまだありません', addCourseFromRepository: '学習を始めるにはリポジトリからコースを追加してください。', progress: '進捗', practice: '練習', continueCourse: '続ける', of: '中', xpEarnedToday: 'XPを今日獲得', browseCourses: 'コースを見る', characterTablePractice: '文字表練習', noCharacterTables: '文字表が追加されていません', addCharacterCourse: '文字を練習する前に、文字表のあるコースを追加してください。', prompt: '問題', chooseReadingFor: '読みを選んでください:', check: '確認', correct: '正解です。', notQuite: '惜しいです。', addCourseBeforeVocab: '語彙を練習する前にコースを追加してください。', addCourseBeforeDialogues: '会話を練習する前にコースを追加してください。', noCourseVocabulary: 'このコースにはまだ語彙項目がありません。', noCourseDialogues: 'このコースにはまだ会話シーンがありません。', addWordsInCreator: 'エディターで単語を追加', addDialoguesInCreator: 'エディターで会話を追加', term: '語句', chooseCorrectMeaning: '正しい意味を選んでください。', nextWord: '次の単語', nextDialogue: '次の会話', localCourse: 'ローカルコース', localCourses: 'ローカルコース', courseSingular: 'コース', coursePlural: 'コース', wordsUnit: '単語', sentencesUnit: '文', dialoguesUnit: '会話', tablesUnit: '表', noVisibleCourses: '表示できるコースがありません', tryDisablingNonAddedFilter: '未追加フィルターをオフにしてください。', completed: '完了', play: '再生', start: '開始', repositoryUrlConfigured: 'リポジトリURL設定済み', repositoryUrlsConfigured: 'リポジトリURL設定済み', coursesLoadedBundled: '件のコースを同梱サンプルリポジトリから読み込みました', coursesLoadedRepository: '件のコースをリポジトリから読み込みました', repositorySavedLocally: 'リポジトリをローカルに保存しました', fetching: '取得中', exampleRepositoryLoaded: 'サンプルリポジトリを読み込みました', brandSubtitle: 'ローカル優先学習', localFirstCompatible: 'ローカル優先 / IndexedDB対応', repositoryUrlLabel: 'リポジトリURL', repositoryUrlPlaceholder: 'リポジトリサーバーURL', selectBestAnswer: '最適な答えを選んでください。', hideReading: '読みを隠す', showReading: '読みを表示', revealMeaningReady: '準備ができたら意味を表示してください。', revealMeaning: '意味を表示', reveal: '表示', tryAgain: 'もう一度', correctAnswerLabel: '正解', tapChunksInOrder: '順番にパーツをタップしてください。', checkToReveal: '確認すると表示', revealUnlocks: '答えるとメモ、例文、読みのヒントが表示されます。', grammarNoteLabel: '文法メモ', readingHint: '読みのヒント', particleHint: 'は が助詞として使われるときは「wa」と発音します。', profile: 'プロフィール', runningCourses: '進行中のコース', noCoursesInProgress: '進行中のコースはありません。', completedCourses: '完了したコース', completedCoursesAppear: '完了したコースがここに表示されます。', lessonsCompleted: 'レッスン完了', badgesEmpty: 'リポジトリ、レッスン、練習で獲得したバッジがここに表示されます。', dialogues: '会話', dialoguePractice: '会話練習', addDialogue: '会話を追加', dialogueLabel: '会話', selectedDialogue: '選択中の会話', dialogueTitle: '会話タイトル', dialogueTurns: '発話', noDialoguesYet: '会話はまだありません', addDialogueToLesson: 'このレッスンに会話を追加してください。', moveDialogueUp: '会話を上へ移動', moveDialogueDown: '会話を下へ移動', dialogueScene: '会話シーン', dialogueParticipants: '会話の参加者', speakerA: '話者A', speakerB: '話者B', learnerRole: '学習者の役割', dialogueLines: '会話行', dialogueLinesHelp: '1行に1発話。「話者: テキスト | 翻訳」の形式です。', responsePromptLine: 'きっかけの行', badgeFirstRepository: '最初のリポジトリ', badgeLessonBuilder: 'レッスンビルダー', badgeVocabStarter: '語彙スパーク', badgeKanaStarter: 'かなスターター', badgeCourseFinisher: 'コース完了', badgeDialogueMaker: '会話メーカー', badgeStreakKeeper: '連続学習キーパー', badgeFirstRepositoryDescription: '最初のリポジトリコースを追加します。', badgeLessonBuilderDescription: '最初のレッスンを完了します。', badgeVocabStarterDescription: '語彙問題に正解します。', badgeKanaStarterDescription: '文字表の問題に正解します。', badgeCourseFinisherDescription: 'コース内のすべてのレッスンを完了します。', badgeDialogueMakerDescription: '会話練習つきのコースを作成します。', badgeStreakKeeperDescription: '学習連続記録を続けます。', isReadAs: 'は次のように読みます:', tryAgainCharacterReading: 'もう一度:', xpEarnedToastLabel: '獲得', repositoryUrlRequired: '先にリポジトリURLを入力してください。', courseSavedToIndexedDb: 'IndexedDBに保存しました', addCourseBeforeLessons: 'レッスンを始める前にコースを追加してください。', courseRemovedLocal: 'ローカルライブラリからコースを削除しました', libraryJsonExported: 'ライブラリJSONを書き出しました', coursesImported: 'コースを読み込みました', importFailed: '読み込みに失敗しました。ZenStudy JSONファイルを選んでください。', draftSavedLocally: '下書きをローカルに保存しました', courseUpdatedInMyCourses: 'マイコースで更新しました', courseAddedInMyCourses: 'マイコースに追加しました', courseJsonExported: 'コースJSONを書き出しました', draftImportFailed: '下書きの読み込みに失敗しました。コースJSONファイルを選んでください。', courseNeedsLesson: 'コースには少なくとも1つのレッスンが必要です。', lessonNeedsExercise: 'レッスンには少なくとも1つの問題が必要です。', audioRequirementComplete: '音声要件を完了にしました', cardRevealed: 'カードを表示しました。', chooseAnswerFirst: '先に答えを選んでください。', settingsSaved: '設定を保存しました', addCharacter: '文字を追加', characterPlaceholder: '1つ以上の文字をスペースまたは改行で区切って入力します。', charactersHelp: '必要なだけ文字を追加できます。スペースまたは改行で区切ってください。',
    courseDraft: 'コース下書き', newCourse: '新しいコース', courseEditor: 'コース編集', draft: '下書き', courseTitle: 'コース名', courseDescription: 'コース説明', sourceLanguage: '元の言語', targetLanguage: '学習言語', updateMyCourse: 'マイコースを更新', addToMyCourses: 'マイコースに追加', testPlay: 'テスト再生', jsonView: 'JSON表示', saveDraft: '下書きを保存', importCourse: 'コースを読み込み', exportCourse: 'コースを書き出し', lessons: 'レッスン', addLesson: 'レッスン追加', lessonLabel: 'レッスン', lessonEditor: 'レッスン編集', lessonTitle: 'レッスン名', explanationText: '説明文', targetVocab: '対象語彙', word: '単語', exampleSentence: '例文', newVocabulary: '新しい語彙', addWord: '単語を追加', practiceExercises: '練習問題', addExercise: '問題を追加', exerciseLabel: '問題', selectedExercise: '選択中の問題', exerciseType: '問題タイプ', promptQuestion: '指示 / 質問', wordPhrase: '単語 / フレーズ', sentence: '文', illustration: 'イラスト', illustrationPlaceholder: '絵文字、アイコン文字、画像URL', meaning: '意味', alternativeReading: '別の読み', readingPlaceholder: 'ひらがな、ローマ字など', translation: '翻訳', blankBefore: '空欄の前', blankAfter: '空欄の後', availableChunks: '使用できるパーツ', chunksPlaceholder: 'パーツ1 | パーツ2 | パーツ3', correctOrder: '正しい順序', orderHelp: '学習者はパーツをタップして答え欄に並べます。正しい順序が自動的に答えとして保存されます。', correctAnswer: '正解', hint: 'ヒント', grammarTitle: '文法タイトル', grammarNote: '文法メモ', exampleReading: '例文の読み', exampleTranslation: '例文の翻訳', answerOptions: '回答オプション', option: '選択肢', validation: '検証', readyToExport: '書き出し準備完了', noBlockingIssues: '重大な問題はありません。', markAudioAttached: '音声ありにする', courseFieldCoverage: 'コース項目の網羅', courseStats: 'コース統計', totalLessons: 'レッスン数', totalExercises: '問題数', totalDialogues: '会話数', vocabCount: '語彙数', moveExerciseUp: '問題を上へ移動', moveExerciseDown: '問題を下へ移動', audioMissing: '音声がありません', needsAttention: '確認が必要です', titleDescriptionRequired: 'タイトルと説明が必要です。', oneLessonRequired: '少なくとも1つのレッスンが必要です。', lessonExerciseRequired: 'すべてのレッスンに1つ以上の問題が必要です。', nativeAudioMissing: '問題1にネイティブ音声の発音がありません。', coverageCoreFields: '指示、タイプ、文、翻訳', coverageReadings: '別の読みと例文の読み', coverageBlankText: '空欄前後のテキスト', coverageAnswerOptions: '回答オプション、チップ、正解', coverageGrammarExamples: 'ヒント、文法メモ、例文', coverageDialogues: '専用の会話シーンと発話', typeLearnCard: '学習カード', typeChoice: '選択', typeTranslate: '翻訳', typeFillBlank: '空欄補充', typeSentenceOrder: '文の並べ替え'
  }
} as const

type UiLocale = keyof typeof uiCopy
type UiCopyKey = keyof typeof uiCopy.en
type BadgeId = 'firstRepository' | 'lessonBuilder' | 'vocabStarter' | 'kanaStarter' | 'courseFinisher' | 'dialogueMaker' | 'streakKeeper'

const emptyPracticeStats = {
  coursesAdded: 0,
  lessonsCompleted: 0,
  vocabularyCorrect: 0,
  characterCorrect: 0,
  creatorCourses: 0,
  dialogueExercisesCreated: 0
}

const legacyBadgeIds: Record<string, BadgeId> = {
  'First Repository': 'firstRepository',
  'Lesson Builder': 'lessonBuilder',
  'Hiragana Star': 'kanaStarter',
  'N5 Basics': 'courseFinisher'
}

const badgeDefinitions: BadgeDefinition[] = [
  { id: 'firstRepository', labelKey: 'badgeFirstRepository', descriptionKey: 'badgeFirstRepositoryDescription', icon: 'material-symbols:cloud-done' },
  { id: 'lessonBuilder', labelKey: 'badgeLessonBuilder', descriptionKey: 'badgeLessonBuilderDescription', icon: 'material-symbols:flag-circle' },
  { id: 'vocabStarter', labelKey: 'badgeVocabStarter', descriptionKey: 'badgeVocabStarterDescription', icon: 'material-symbols:style' },
  { id: 'kanaStarter', labelKey: 'badgeKanaStarter', descriptionKey: 'badgeKanaStarterDescription', icon: 'material-symbols:table-chart' },
  { id: 'courseFinisher', labelKey: 'badgeCourseFinisher', descriptionKey: 'badgeCourseFinisherDescription', icon: 'material-symbols:workspace-premium' },
  { id: 'dialogueMaker', labelKey: 'badgeDialogueMaker', descriptionKey: 'badgeDialogueMakerDescription', icon: 'material-symbols:forum' },
  { id: 'streakKeeper', labelKey: 'badgeStreakKeeper', descriptionKey: 'badgeStreakKeeperDescription', icon: 'material-symbols:local-fire-department' }
]

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

function countLabel(count: number, singularKey: UiCopyKey, pluralKey: UiCopyKey) {
  return `${count} ${t(count === 1 ? singularKey : pluralKey)}`
}

function localizedRepositoryStatus(status: string) {
  if (status === 'Example repository loaded') return t('exampleRepositoryLoaded')
  if (status === 'Repository saved locally') return t('repositorySavedLocally')
  const configuredMatch = status.match(/^(\d+) repository URLs? configured$/)
  if (configuredMatch) return countLabel(Number(configuredMatch[1]), 'repositoryUrlConfigured', 'repositoryUrlsConfigured')
  const bundledMatch = status.match(/^(\d+) courses loaded from bundled example repository$/)
  if (bundledMatch) return `${bundledMatch[1]} ${t('coursesLoadedBundled')}`
  const loadedMatch = status.match(/^(\d+) courses loaded from repository$/)
  if (loadedMatch) return `${loadedMatch[1]} ${t('coursesLoadedRepository')}`
  const fetchingMatch = status.match(/^Fetching (.+)\.\.\.$/)
  if (fetchingMatch) return `${t('fetching')} ${fetchingMatch[1]}...`
  return status
}

function normalizePracticeStats(stats: Profile['practiceStats'] = emptyPracticeStats) {
  return { ...emptyPracticeStats, ...stats }
}

function normalizeBadgeIds(badges: string[] = []) {
  return badges.map(badge => legacyBadgeIds[badge] || badge).filter((badge): badge is BadgeId => badgeDefinitions.some(definition => definition.id === badge))
}

function completedLessonCount(profileValue = profile.value) {
  return Object.values(profileValue.completedLessons || {}).reduce((total, lessonIds) => total + lessonIds.length, 0)
}

function hasDialogueDraft() {
  return creatorDrafts.value.some((draft) => {
    const lessons = normalizeCreatorLessons(draft.lessonData, draft.words)
    return lessons.some(lesson => Array.isArray(lesson.dialogues) && lesson.dialogues.length)
  })
}

function earnedBadgeIds(profileValue = profile.value, courseList = courses.value) {
  const stats = normalizePracticeStats(profileValue.practiceStats)
  const completedLessons = Math.max(stats.lessonsCompleted, completedLessonCount(profileValue))
  const completedCourseCount = courseList.filter(course => (course.progress || 0) >= 100).length
  const earned = new Set<BadgeId>()
  if (stats.coursesAdded > 0 || courseList.length > 0) earned.add('firstRepository')
  if (completedLessons > 0) earned.add('lessonBuilder')
  if (stats.vocabularyCorrect > 0) earned.add('vocabStarter')
  if (stats.characterCorrect > 0) earned.add('kanaStarter')
  if (completedCourseCount > 0) earned.add('courseFinisher')
  if (stats.dialogueExercisesCreated > 0 || hasDialogueDraft()) earned.add('dialogueMaker')
  if (profileValue.streak >= 2) earned.add('streakKeeper')
  return Array.from(earned)
}

function profileWithBadges(profileValue: Profile, courseList = courses.value): Profile {
  return {
    ...profileValue,
    practiceStats: normalizePracticeStats(profileValue.practiceStats),
    badges: earnedBadgeIds(profileValue, courseList)
  }
}

function badgeLabel(id: string) {
  const badgeId = legacyBadgeIds[id] || id
  const definition = badgeDefinitions.find(item => item.id === badgeId)
  return definition ? t(definition.labelKey) : id
}

function badgeUnlockedMessage(id: BadgeId) {
  return `${badgeLabel(id)} ${activeUiLocale() === 'de' ? 'freigeschaltet' : activeUiLocale() === 'ja' ? '解除しました' : 'unlocked'}`
}

function characterReadingMessage(state: LessonState, character = 'き', reading = 'ki') {
  const prefix = state === 'correct' ? t('correct') : t('notQuite')
  return `${prefix} ${character} ${t('isReadAs')} ${reading}.`
}

function slugifyFilename(value: string, fallback = 'zenstudy-course') {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

function courseExportPayload() {
  const snapshot = buildDraftSnapshot()
  return {
    ...snapshot,
    id: slugifyFilename(snapshot.title, snapshot.id),
    name: snapshot.title,
    lessonData: creatorLessons.value,
    audioAttached: audioAttached.value
  }
}

const earnedBadges = computed(() => badgeDefinitions.filter(definition => normalizeBadgeIds(profile.value.badges).includes(definition.id)))
const allBadges = computed(() => {
  const earnedIds = normalizeBadgeIds(profile.value.badges)
  return badgeDefinitions.map(definition => ({ ...definition, earned: earnedIds.includes(definition.id) }))
})

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
const exerciseTypeOptions = computed(() => exerciseTypeDefinitions.map(option => ({ value: option.value, label: t(option.labelKey) })))

function setUiLanguage(language: string) {
  uiLanguage.value = language
  locale.value = language
  if (import.meta.client) window.localStorage.setItem('zenstudy_ui_language', language)
}

function exerciseTypeLabel(type: LessonExercise['type']) {
  return exerciseTypeOptions.value.find(option => option.value === type)?.label || type
}

function isImageIllustration(value?: string) {
  if (!value) return false
  const trimmedValue = value.trim()
  return /^(https?:|data:image\/|blob:)/i.test(trimmedValue) || /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(trimmedValue)
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
    stats: { lessons: 42, exercises: 262, words: 450, sentences: 120, dialogues: 1, characters: 92, characterTables: 2 },
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
    stats: { lessons: 12, exercises: 97, words: 0, sentences: 20, dialogues: 0, characters: 46, characterTables: 1 },
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
    stats: { lessons: 18, exercises: 141, words: 160, sentences: 90, dialogues: 2, characters: 0, characterTables: 0 },
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
    characterTables: [
      { id: 'ja-hiragana-vowels', title: 'Hiragana Vowels', description: 'The five base vowel sounds.', characters: ['あ', 'い', 'う', 'え', 'お'] },
      { id: 'ja-hiragana-kst', title: 'Hiragana K/S/T Rows', description: 'Early consonant rows for recognition drills.', characters: ['か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ'] }
    ],
    characters: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ'],
    characterPrompt: { character: 'き', answers: ['ka', 'ki', 'ku', 'ke'], correctAnswer: 'ki' },
    vocabulary: [
      { id: 'vocab-konnichiwa', term: 'こんにちは', reading: 'こんにちは', meaning: 'Hello' },
      { id: 'vocab-watashi', term: '私', reading: 'わたし', meaning: 'I; me' },
      { id: 'vocab-gakusei', term: '学生', reading: 'がくせい', meaning: 'student' },
      { id: 'vocab-gakkou', term: '学校', reading: 'がっこう', meaning: 'school' }
    ],
    dialogues: [
      {
        id: 'dialogue-first-greeting',
        lessonId: 'foundations-greetings',
        title: 'First Greeting',
        context: 'Two people greet each other for the first time.',
        speakerA: 'Tanaka',
        speakerB: 'Learner',
        learnerRole: 'Learner',
        lines: [
          { speaker: 'Tanaka', text: 'こんにちは。', translation: 'Hello.' },
          { speaker: 'Learner', text: 'こんにちは、田中さん。', translation: 'Hello, Mr. Tanaka.', answerOptions: ['こんにちは、田中さん。', 'コーヒーをください。', '水をください。'], correctAnswer: 'こんにちは、田中さん。' },
          { speaker: 'Tanaka', text: 'お元気ですか。', translation: 'How are you?' },
          { speaker: 'Learner', text: '元気です。', translation: 'I am well.', answerOptions: ['元気です。', '水をください。', 'はい、どうぞ。'], correctAnswer: '元気です。' }
        ]
      }
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
            id: 'learn-konnichiwa',
            type: 'learn',
            prompt: 'Learn this greeting.',
            sentence: 'こんにちは',
            illustration: '👋',
            reading: 'こんにちは',
            translation: 'Hello',
            options: [],
            correctAnswer: 'Hello',
            hint: 'Reveal the meaning, then continue.',
            grammarTitle: 'Learning Card',
            grammarNote: 'Use this card to connect the word, reading, and meaning before answering practice questions.',
            example: 'こんにちは、田中さん。',
            exampleReading: 'こんにちは、たなかさん。',
            exampleTranslation: 'Hello, Mr. Tanaka.'
          },
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
            id: 'learn-watashi',
            type: 'learn',
            prompt: 'Learn this pronoun.',
            sentence: '私',
            illustration: '🧑',
            reading: 'わたし',
            translation: 'I; me',
            options: [],
            correctAnswer: 'I; me',
            hint: 'Reveal the meaning before practicing the particle sentence.',
            grammarTitle: 'Learning Card',
            grammarNote: '私 is a common neutral way to say I or me.',
            example: '私は学生です。',
            exampleReading: 'わたしはがくせいです。',
            exampleTranslation: 'I am a student.'
          },
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
    characterTables: [
      { id: 'hiragana-basic', title: 'Hiragana Basic Rows', description: 'Vowels and first consonant rows.', characters: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と'] }
    ],
    characters: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と'],
    characterPrompt: { character: 'そ', answers: ['so', 'se', 'sa', 'shi'], correctAnswer: 'so' },
    vocabulary: [
      { id: 'vocab-a', term: 'あ', reading: 'a', meaning: 'hiragana a' },
      { id: 'vocab-i', term: 'い', reading: 'i', meaning: 'hiragana i' },
      { id: 'vocab-u', term: 'う', reading: 'u', meaning: 'hiragana u' }
    ],
    dialogues: [],
    lessons: [
      {
        id: 'hiragana-a-row',
        title: 'A Row',
        description: 'Read あいうえお quickly.',
        unitTitle: 'Kana Table 1',
        unitDescription: 'Recognize the core vowel row and first consonant rows.',
        exercises: [
          {
            id: 'learn-hiragana-a',
            type: 'learn',
            prompt: 'Learn this kana.',
            sentence: 'あ',
            illustration: 'あ',
            reading: 'a',
            translation: 'hiragana a',
            options: [],
            correctAnswer: 'hiragana a',
            hint: 'Reveal the reading, then practice recognition.',
            grammarTitle: 'Learning Card',
            grammarNote: 'あ is the first hiragana vowel sound.',
            example: 'あめ',
            exampleReading: 'ame',
            exampleTranslation: 'rain; candy'
          },
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
    characterTables: [],
    characters: [],
    vocabulary: [
      { id: 'vocab-coffee', term: 'コーヒー', reading: 'コーヒー', meaning: 'coffee' },
      { id: 'vocab-water', term: '水', reading: 'みず', meaning: 'water' },
      { id: 'vocab-kudasai', term: 'ください', reading: 'ください', meaning: 'please give me' }
    ],
    dialogues: [
      {
        id: 'dialogue-order-coffee',
        lessonId: 'dialogue-ordering',
        title: 'Ordering Coffee',
        context: 'A customer orders a drink at a cafe.',
        speakerA: 'Staff',
        speakerB: 'Customer',
        learnerRole: 'Customer',
        lines: [
          { speaker: 'Staff', text: 'いらっしゃいませ。', translation: 'Welcome.' },
          { speaker: 'Customer', text: 'コーヒーをください。', translation: 'Coffee, please.', answerOptions: ['コーヒーをください。', '水をください。', 'すみません。'], correctAnswer: 'コーヒーをください。' },
          { speaker: 'Staff', text: 'ほかにご注文はありますか。', translation: 'Would you like anything else?' },
          { speaker: 'Customer', text: 'いいえ、以上です。', translation: 'No, that is all.', answerOptions: ['いいえ、以上です。', 'はい、どうぞ。', 'こんにちは。'], correctAnswer: 'いいえ、以上です。' }
        ]
      },
      {
        id: 'dialogue-water-request',
        lessonId: 'dialogue-ordering',
        title: 'Asking For Water',
        context: 'A traveler asks politely for water.',
        speakerA: 'Traveler',
        speakerB: 'Staff',
        learnerRole: 'Traveler',
        lines: [
          { speaker: 'Staff', text: '何かお探しですか。', translation: 'Are you looking for something?' },
          { speaker: 'Traveler', text: 'すみません。', translation: 'Excuse me.', answerOptions: ['すみません。', 'コーヒーをください。', 'はい。'], correctAnswer: 'すみません。' },
          { speaker: 'Staff', text: 'はい。', translation: 'Yes?' },
          { speaker: 'Traveler', text: '水をください。', translation: 'Water, please.', answerOptions: ['水をください。', 'コーヒーをください。', 'こんにちは。'], correctAnswer: '水をください。' }
        ]
      }
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
            id: 'learn-coffee',
            type: 'learn',
            prompt: 'Learn this cafe word.',
            sentence: 'コーヒー',
            illustration: '☕',
            reading: 'コーヒー',
            translation: 'coffee',
            options: [],
            correctAnswer: 'coffee',
            hint: 'Reveal the meaning before practicing the request phrase.',
            grammarTitle: 'Learning Card',
            grammarNote: 'コーヒー is a loanword written in katakana.',
            example: 'コーヒーをください。',
            exampleReading: 'コーヒーをください。',
            exampleTranslation: 'Coffee, please.'
          },
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
  return Boolean(content?.characterTables?.length || content?.characters.length || content?.characterPrompt)
}))
const dialogueCourseOptions = computed(() => activeCourses.value.filter(course => Boolean(getCourseContent(course.id)?.dialogues?.length)))
const selectedCourse = computed(() => availableCourses.value.find(course => course.id === selectedCourseId.value) || activeCourse.value || catalogCourses[0])
const selectedContent = computed(() => getCourseContent(selectedCourse.value?.id) || courseContent['ja-foundations-a1'])
const selectedLesson = computed(() => selectedContent.value.lessons[selectedLessonIndex.value] || selectedContent.value.lessons[0])
const currentExercise = computed(() => selectedLesson.value.exercises[selectedExerciseIndex.value] || selectedLesson.value.exercises[0])
const isLearnExercise = computed(() => currentExercise.value.type === 'learn')
const isOrderingExercise = computed(() => currentExercise.value.type === 'sentence-order')
const orderingPool = computed(() => currentExercise.value.options.length ? currentExercise.value.options : currentExercise.value.orderItems || [])
const availableOrderItems = computed(() => orderingPool.value.filter((item, index) => orderedAnswer.value.filter(selected => selected === item).length < orderingPool.value.filter((candidate, candidateIndex) => candidate === item && candidateIndex <= index).length))
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
const selectedCreatorExercise = computed(() => selectedCreatorLesson.value?.exercises.find(exercise => exercise.id === selectedCreatorExerciseId.value) || selectedCreatorLesson.value?.exercises[0])
const selectedCreatorDialogue = computed(() => selectedCreatorLesson.value?.dialogues.find(dialogue => dialogue.id === selectedCreatorDialogueId.value) || selectedCreatorLesson.value?.dialogues[0])
const selectedCreatorCharacterTable = computed(() => creatorCharacterTables.value.find(table => table.id === selectedCreatorCharacterTableId.value) || creatorCharacterTables.value[0])
const draftCourseContents = computed(() => Object.fromEntries(creatorDrafts.value
  .map(draft => draft.id === creatorDraft.value.id ? buildDraftSnapshot() : draft)
  .map(draft => [draft.id, draftToCourseContent(draft)])))
const isCreatorDraftAdded = computed(() => courses.value.some(course => course.id === creatorDraft.value.id))
const characterTables = computed(() => activeContent.value?.characterTables?.length
  ? activeContent.value.characterTables
  : activeContent.value?.characters.length
    ? [{ id: 'legacy-characters', title: activeCourse.value?.name || t('characters'), description: '', characters: activeContent.value.characters }]
    : [])
const activeCharacterTable = computed(() => characterTables.value[characterTableIndex.value] || characterTables.value[0])
const activeCharacterList = computed(() => activeCharacterTable.value?.characters || activeContent.value?.characters || [])
const characterPrompts = computed(() => {
  if (!activeContent.value) return []
  const tablePrompts = activeCharacterTable.value?.prompts || []
  const promptedCharacters = new Set(tablePrompts.map(prompt => prompt.character))
  const prompts = activeCharacterList.value
    .filter(character => kanaReadings[character] && !promptedCharacters.has(character))
    .map(character => {
      const correctAnswer = kanaReadings[character]
      const distractors = Object.values(kanaReadings).filter(reading => reading !== correctAnswer).slice(0, 3)
      return { character, correctAnswer, answers: [correctAnswer, ...distractors].sort() }
    })

  return tablePrompts.length || prompts.length
    ? [...tablePrompts, ...prompts]
    : activeContent.value.characterPrompt ? [activeContent.value.characterPrompt] : []
})
const activeCharacterPrompt = computed(() => characterPrompts.value[characterPromptIndex.value] || characterPrompts.value[0])
const vocabularyItems = computed(() => activeContent.value?.vocabulary || [])
const activeVocabularyItem = computed(() => vocabularyItems.value[vocabularyIndex.value] || vocabularyItems.value[0])
const dialogueItems = computed(() => activeContent.value?.dialogues || [])
const activeDialogueItem = computed(() => dialogueItems.value[dialoguePracticeIndex.value] || dialogueItems.value[0])
const dialogueLearnerLineIndexes = computed(() => activeDialogueItem.value?.lines
  .map((line, index) => line.speaker === activeDialogueItem.value?.learnerRole ? index : -1)
  .filter(index => index >= 0) || [])
const activeDialogueAnswerIndex = computed(() => dialogueLearnerLineIndexes.value[Math.min(dialogueQuestionIndex.value, Math.max(dialogueLearnerLineIndexes.value.length - 1, 0))] ?? -1)
const activeDialogueAnswerLine = computed(() => activeDialogueAnswerIndex.value >= 0 ? activeDialogueItem.value?.lines[activeDialogueAnswerIndex.value] : undefined)
const activeDialogueCorrectAnswer = computed(() => activeDialogueAnswerLine.value?.correctAnswer || activeDialogueAnswerLine.value?.text || '')
const activeDialoguePromptLine = computed(() => {
  if (!activeDialogueItem.value || activeDialogueAnswerIndex.value <= 0) return undefined
  const previousLines = activeDialogueItem.value.lines.slice(0, activeDialogueAnswerIndex.value).reverse()
  return previousLines.find(line => line.speaker !== activeDialogueItem.value?.learnerRole) || previousLines[0]
})
const completedDialogueLines = computed(() => activeDialogueItem.value && activeDialogueAnswerIndex.value >= 0 ? activeDialogueItem.value.lines.slice(0, activeDialogueAnswerIndex.value) : [])
const dialogueAnswerOptions = computed(() => {
  const correct = activeDialogueCorrectAnswer.value
  const definedOptions = Array.from(new Set(activeDialogueAnswerLine.value?.answerOptions?.filter(Boolean) || []))
  if (definedOptions.length) return definedOptions
  const localDistractors = dialogueItems.value.flatMap(dialogue => dialogue.lines
    .filter(line => line.speaker === dialogue.learnerRole)
    .flatMap(line => line.answerOptions?.length ? line.answerOptions : [line.correctAnswer || line.text])
    .filter(answer => answer !== correct))
  const bundledDistractors = Object.values(courseContent).flatMap(content => content.dialogues.flatMap(dialogue => dialogue.lines
    .filter(line => line.speaker === dialogue.learnerRole)
    .flatMap(line => line.answerOptions?.length ? line.answerOptions : [line.correctAnswer || line.text])
    .filter(answer => answer !== correct)))
  const options = Array.from(new Set([correct, ...localDistractors, ...bundledDistractors])).filter(Boolean).slice(0, 4)
  const offset = options.length ? (dialoguePracticeIndex.value + dialogueQuestionIndex.value + 1) % options.length : 0
  return [...options.slice(offset), ...options.slice(0, offset)]
})
const dialogueFinished = computed(() => Boolean(dialogueLearnerLineIndexes.value.length && dialogueQuestionIndex.value >= dialogueLearnerLineIndexes.value.length - 1 && dialogueFeedback.value === 'correct'))
const lessonProgress = computed(() => Math.round(((selectedExerciseIndex.value + (lessonState.value === 'correct' ? 1 : 0)) / Math.max(selectedLesson.value.exercises.length, 1)) * 100))
const vocabularyOptions = computed(() => {
  const correct = activeVocabularyItem.value?.meaning || ''
  const distractors = vocabularyItems.value.map(item => item.meaning).filter(meaning => meaning !== correct).slice(0, 3)
  return Array.from(new Set([correct, ...distractors])).filter(Boolean).sort()
})
const creatorSchemaCoverage = computed(() => [
  t('coverageCoreFields'),
  t('coverageReadings'),
  t('coverageBlankText'),
  t('coverageAnswerOptions'),
  t('coverageGrammarExamples'),
  t('coverageDialogues')
])
const creatorJson = computed(() => JSON.stringify(courseExportPayload(), null, 2))
const creatorIssues = computed(() => [
  ...(creatorDraft.value.title.trim() && creatorDraft.value.description.trim() ? [] : [t('titleDescriptionRequired')]),
  ...(creatorLessons.value.length ? [] : [t('oneLessonRequired')]),
  ...(creatorLessons.value.every(lesson => lesson.exercises.length) ? [] : [t('lessonExerciseRequired')]),
  ...(audioAttached.value ? [] : [t('nativeAudioMissing')])
])

const navigation = [
  { key: 'dashboard', labelKey: 'dashboard', icon: 'material-symbols:dashboard' },
  { key: 'repository', labelKey: 'courses', icon: 'material-symbols:menu-book' },
  { key: 'map', labelKey: 'courseMap', icon: 'material-symbols:route' },
  { key: 'characters', labelKey: 'characters', icon: 'material-symbols:table-chart' },
  { key: 'vocabulary', labelKey: 'vocabulary', icon: 'material-symbols:style' },
  { key: 'dialogues', labelKey: 'dialogues', icon: 'material-symbols:forum' },
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
    loadCreatorDraft(storedDrafts[0])
  }
  else {
    creatorDrafts.value = [creatorDraft.value]
  }
  profile.value = profileWithBadges(storedProfile, storedCourses)
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
  if (view === 'dialogues' && dialogueCourseOptions.value.length && !dialogueCourseOptions.value.some(course => course.id === selectedCourseId.value)) {
    selectPracticeCourse(dialogueCourseOptions.value[0].id)
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

function normalizeDialogueLines(value: unknown): DialogueLine[] {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => {
    if (isRecord(item)) {
      const text = typeof item.text === 'string' ? item.text : ''
      const answerOptions = Array.isArray(item.answerOptions)
        ? item.answerOptions.map(String).filter(Boolean)
        : Array.isArray(item.options)
          ? item.options.map(String).filter(Boolean)
          : []
      const correctAnswer = typeof item.correctAnswer === 'string' && item.correctAnswer.trim() ? item.correctAnswer : text
      return {
        speaker: typeof item.speaker === 'string' ? item.speaker : `Speaker ${index + 1}`,
        text,
        translation: typeof item.translation === 'string' ? item.translation : '',
        answerOptions: Array.from(new Set([correctAnswer, ...answerOptions, text].filter(Boolean))),
        correctAnswer
      }
    }
    const text = String(item)
    return { speaker: `Speaker ${index + 1}`, text, translation: '', answerOptions: [text], correctAnswer: text }
  }).filter(line => line.text.trim())
}

function parseDialogueLines(value: string): DialogueLine[] {
  return value.split('\n').map((rawLine, index) => {
    const [speakerAndText, translation = ''] = rawLine.split('|').map(part => part.trim())
    const colonIndex = speakerAndText.indexOf(':')
    const speaker = colonIndex >= 0 ? speakerAndText.slice(0, colonIndex).trim() || `Speaker ${index + 1}` : `Speaker ${index + 1}`
    const text = colonIndex >= 0 ? speakerAndText.slice(colonIndex + 1).trim() : speakerAndText.trim()
    return { speaker, text, translation, answerOptions: [text], correctAnswer: text }
  }).filter(line => line.text)
}

function dialogueLinesToText(lines: DialogueLine[]) {
  return lines.map(line => `${line.speaker}: ${line.text}${line.translation ? ` | ${line.translation}` : ''}`).join('\n')
}

function isLegacyDialogueExercise(value: unknown) {
  return isRecord(value) && (value.type === 'dialogue-order-lines' || value.type === 'dialogue-response-choice')
}

function normalizeCreatorDialogue(value: unknown, index: number): CreatorDialogue {
  const dialogue = isRecord(value) ? value : {}
  const lines = normalizeDialogueLines('lines' in dialogue ? dialogue.lines : dialogue.dialogueLines)
  return {
    id: typeof dialogue.id === 'string' ? dialogue.id : `dialogue-${Date.now()}-${index}`,
    title: typeof dialogue.title === 'string' ? dialogue.title : typeof dialogue.prompt === 'string' ? dialogue.prompt : `Dialogue ${index + 1}`,
    context: typeof dialogue.context === 'string' ? dialogue.context : typeof dialogue.dialogueContext === 'string' ? dialogue.dialogueContext : '',
    speakerA: typeof dialogue.speakerA === 'string' ? dialogue.speakerA : typeof dialogue.dialogueSpeaker === 'string' ? dialogue.dialogueSpeaker : lines[0]?.speaker || 'Speaker A',
    speakerB: typeof dialogue.speakerB === 'string' ? dialogue.speakerB : typeof dialogue.dialoguePartner === 'string' ? dialogue.dialoguePartner : lines[1]?.speaker || 'Speaker B',
    learnerRole: typeof dialogue.learnerRole === 'string' ? dialogue.learnerRole : typeof dialogue.dialogueLearnerRole === 'string' ? dialogue.dialogueLearnerRole : lines[1]?.speaker || 'Speaker B',
    lines
  }
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

function showBadgeUnlockToasts(previousBadges: BadgeId[]) {
  normalizeBadgeIds(profile.value.badges)
    .filter(badge => !previousBadges.includes(badge))
    .forEach(badge => showToast(badgeUnlockedMessage(badge), 'success'))
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
  const previousBadges = normalizeBadgeIds(profile.value.badges)
  const nextProfile = profileWithBadges({
    ...profile.value,
    ...patch,
    practiceStats: normalizePracticeStats(patch.practiceStats || profile.value.practiceStats),
    xp: nextXp,
    level: Math.floor(nextXp / xpPerLevel) + 1,
    streak: nextStreak(profile.value.lastStudiedAt),
    lastStudiedAt: dateKey(new Date()),
    dailyXp: Math.min(profile.value.dailyGoal, profile.value.dailyXp + amount)
  })
  profile.value = await database.saveProfile(nextProfile)
  xpAnimationBoost.value = Math.max(0, xpAnimationBoost.value - amount)
  showToast(`+${amount} XP ${label}`, 'success')
  showBadgeUnlockToasts(previousBadges)
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
  const validType = exercise.type === 'learn' || exercise.type === 'fill-blank' || exercise.type === 'translate' || exercise.type === 'choice' || exercise.type === 'sentence-order'
  return {
    id: typeof exercise.id === 'string' ? exercise.id : `exercise-${Date.now()}-${index}`,
    type: validType ? exercise.type : 'choice',
    prompt: typeof exercise.prompt === 'string' ? exercise.prompt : 'Choose the correct answer.',
    sentence: typeof exercise.sentence === 'string' ? exercise.sentence : '例文を入力します。',
    illustration: typeof exercise.illustration === 'string' ? exercise.illustration : '',
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

function normalizeCreatorWords(value: unknown, fallbackWords: string[] = []): CreatorWord[] {
  const source = Array.isArray(value) ? value : fallbackWords
  return source.map((item, index) => {
    if (isRecord(item)) {
      const term = typeof item.term === 'string' ? item.term : typeof item.word === 'string' ? item.word : String(item)
      return {
        id: typeof item.id === 'string' ? item.id : `word-${Date.now()}-${index}`,
        term,
        example: typeof item.example === 'string' ? item.example : ''
      }
    }
    return {
      id: `word-${String(item).replace(/\s+/g, '-').toLowerCase()}-${index}`,
      term: String(item),
      example: ''
    }
  }).filter(word => word.term.trim())
}

function normalizeCreatorCharacterTables(value: unknown): CreatorCharacterTable[] {
  const tables = Array.isArray(value) ? value : []
  return tables.map((item, index) => {
    const table = isRecord(item) ? item : {}
    const characters = Array.isArray(table.characters) ? table.characters.map(String).filter(Boolean) : []
    const rawPrompts = Array.isArray(table.prompts) ? table.prompts : []
    const prompts = rawPrompts.map((prompt, promptIndex) => {
      const promptRecord = isRecord(prompt) ? prompt : {}
      const character = typeof promptRecord.character === 'string' ? promptRecord.character : characters[promptIndex] || ''
      const answers = Array.isArray(promptRecord.answers) ? promptRecord.answers.map(String).filter(Boolean) : []
      const fallbackAnswer = kanaReadings[character] || answers[0] || character
      const correctAnswer = typeof promptRecord.correctAnswer === 'string' && promptRecord.correctAnswer.trim() ? promptRecord.correctAnswer : fallbackAnswer
      return {
        character,
        answers: Array.from(new Set([correctAnswer, ...answers].filter(Boolean))),
        correctAnswer
      }
    }).filter(prompt => prompt.character)
    const normalizedTable = {
      id: typeof table.id === 'string' ? table.id : `character-table-${Date.now()}-${index}`,
      title: typeof table.title === 'string' ? table.title : `Character Table ${index + 1}`,
      description: typeof table.description === 'string' ? table.description : '',
      characters,
      prompts
    }
    syncCharacterTablePrompts(normalizedTable)
    return normalizedTable
  }).filter(table => table.title.trim())
}

function characterListToText(characters: string[]) {
  return characters.join(' ')
}

function characterTextToList(value: string) {
  return Array.from(new Set(value.split(/[\s,|]+/).map(character => character.trim()).filter(Boolean)))
}

function defaultCharacterPrompt(character: string): CharacterPrompt {
  const correctAnswer = kanaReadings[character] || character
  const distractors = Object.values(kanaReadings).filter(reading => reading !== correctAnswer).slice(0, 3)
  return { character, answers: Array.from(new Set([correctAnswer, ...distractors].filter(Boolean))), correctAnswer }
}

function syncCharacterTablePrompts(table: CreatorCharacterTable) {
  const existingPrompts = new Map(table.prompts.map(prompt => [prompt.character, prompt]))
  table.prompts = table.characters.map((character) => {
    const prompt = existingPrompts.get(character) || defaultCharacterPrompt(character)
    const correctAnswer = prompt.correctAnswer || prompt.answers[0] || kanaReadings[character] || character
    return {
      character,
      answers: Array.from(new Set([correctAnswer, ...prompt.answers].filter(Boolean))),
      correctAnswer
    }
  })
}

function setCharacterTableCharacters(table: CreatorCharacterTable, value: string) {
  table.characters = characterTextToList(value)
  syncCharacterTablePrompts(table)
}

function addCharactersToTable(table: CreatorCharacterTable) {
  const nextCharacters = characterTextToList(characterTableCharacterInput.value)
  if (!nextCharacters.length) return
  table.characters = Array.from(new Set([...table.characters, ...nextCharacters]))
  syncCharacterTablePrompts(table)
  characterTableCharacterInput.value = ''
}

function characterPromptFor(table: CreatorCharacterTable, character: string) {
  const prompt = table.prompts.find(item => item.character === character)
  if (prompt) return prompt
  const nextPrompt = defaultCharacterPrompt(character)
  table.prompts = [...table.prompts, nextPrompt]
  return nextPrompt
}

function setCharacterPromptOptions(prompt: CharacterPrompt, value: string) {
  const answers = Array.from(new Set(value.split('|').map(answer => answer.trim()).filter(Boolean)))
  prompt.answers = answers.includes(prompt.correctAnswer) ? answers : Array.from(new Set([prompt.correctAnswer, ...answers].filter(Boolean)))
  if (!prompt.answers.includes(prompt.correctAnswer)) prompt.correctAnswer = prompt.answers[0] || ''
}

function setCharacterPromptCorrectAnswer(prompt: CharacterPrompt, answer: string) {
  prompt.correctAnswer = answer
  prompt.answers = Array.from(new Set([answer, ...prompt.answers].filter(Boolean)))
}

function addCharacterPromptOption(prompt: CharacterPrompt) {
  const answer = window.prompt(t('option'))?.trim()
  if (!answer) return
  prompt.answers = Array.from(new Set([...prompt.answers, answer]))
}

function normalizeCreatorLessons(data: unknown, words: string[] = []) {
  const lessons = Array.isArray(data) ? data : []
  return lessons.length
    ? lessons.map((value, index) => {
        const lesson = isRecord(value) ? value as Partial<CreatorLesson> : {}
        const rawExercises = Array.isArray(lesson.exercises) ? lesson.exercises : []
        const migratedDialogues = rawExercises.filter(isLegacyDialogueExercise).map(normalizeCreatorDialogue)
        const dialogues = [
          ...(Array.isArray(lesson.dialogues) ? lesson.dialogues.map(normalizeCreatorDialogue) : []),
          ...migratedDialogues
        ]
        return {
          id: typeof lesson.id === 'string' ? lesson.id : `lesson-${Date.now()}-${index}`,
          title: typeof lesson.title === 'string' ? lesson.title : `Lesson ${index + 1}`,
          explanation: typeof lesson.explanation === 'string' ? lesson.explanation : 'Write the lesson explanation here.',
          words: normalizeCreatorWords(lesson.words, words),
          exercises: rawExercises.filter(exercise => !isLegacyDialogueExercise(exercise)).map(normalizeCreatorExercise).filter(Boolean).length ? rawExercises.filter(exercise => !isLegacyDialogueExercise(exercise)).map(normalizeCreatorExercise) : [createCreatorExercise()],
          dialogues
        }
      })
    : [{ id: `lesson-${Date.now()}`, title: 'Lesson 1', explanation: 'Write the lesson explanation here.', words: normalizeCreatorWords(words), exercises: [createCreatorExercise('Choose the correct answer.')], dialogues: [] }]
}

function draftToCourseContent(draft: CreatorDraft): CourseContent {
  const lessons = normalizeCreatorLessons(draft.lessonData, draft.words)
  const tables = normalizeCreatorCharacterTables(draft.characterTables)
  return {
    courseId: draft.id,
    mapTitle: draft.title,
    mapDescription: draft.description,
    characterTables: tables.map(table => ({ ...table })),
    characters: Array.from(new Set(tables.flatMap(table => table.characters))),
    vocabulary: lessons.flatMap(lesson => lesson.words).map(word => ({ id: `vocab-${word.id}`, term: word.term, reading: '', meaning: word.term, example: word.example })),
    dialogues: lessons.flatMap(lesson => lesson.dialogues.map(dialogue => ({
      id: dialogue.id,
      lessonId: lesson.id,
      title: dialogue.title,
      context: dialogue.context,
      speakerA: dialogue.speakerA,
      speakerB: dialogue.speakerB,
      learnerRole: dialogue.learnerRole,
      lines: dialogue.lines
    }))),
    lessons: lessons.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.explanation,
      unitTitle: `Unit ${index + 1}`,
      unitDescription: lesson.explanation,
      exercises: lesson.exercises.map((exercise): LessonExercise => {
        const orderItems = exercise.orderItems
        return {
          id: exercise.id,
          type: exercise.type,
          prompt: exercise.prompt,
          sentence: exercise.sentence,
          illustration: exercise.illustration,
          reading: exercise.reading,
          translation: exercise.translation,
          blankBefore: exercise.blankBefore,
          blankAfter: exercise.blankAfter,
          options: exercise.type === 'sentence-order'
            ? Array.from(new Set(exercise.chips.length ? exercise.chips : orderItems)).filter(Boolean)
            : Array.from(new Set([...exercise.chips, exercise.answer])).filter(Boolean),
          orderItems,
          correctAnswer: exercise.type === 'learn' ? exercise.translation || exercise.answer : exercise.answer,
          hint: exercise.hint,
          grammarTitle: exercise.grammarTitle,
          grammarNote: exercise.grammarNote,
          example: exercise.example,
          exampleReading: exercise.exampleReading,
          exampleTranslation: exercise.exampleTranslation
        }
      })
    }))
  }
}

function draftToCourseSummary(draft: CreatorDraft): CourseSummary {
  const lessons = normalizeCreatorLessons(draft.lessonData, draft.words)
  const tables = normalizeCreatorCharacterTables(draft.characterTables)
  const exercises = lessons.flatMap(lesson => lesson.exercises)
  const dialogues = lessons.flatMap(lesson => lesson.dialogues)
  const words = Array.from(new Set(lessons.flatMap(lesson => lesson.words.map(word => word.term))))
  const characters = Array.from(new Set(tables.flatMap(table => table.characters)))
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
      dialogues: dialogues.length,
      characters: characters.length,
      characterTables: tables.length
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
    showToast(t('repositoryUrlRequired'), 'warning')
    return
  }
  repositoryStatus.value = `Fetching ${trimmedUrl}...`
  try {
    if (trimmedUrl.includes('example.dev')) {
      const status = `${catalogCourses.length} courses loaded from bundled example repository`
      await upsertRepositorySection(trimmedUrl, catalogCourses, status)
      showToast(localizedRepositoryStatus(status), 'success')
      return
    }

    const endpoint = trimmedUrl.includes('example.dev') ? '/api/courses' : trimmedUrl
    const payload = await $fetch<RepositoryPayload | CourseSummary[]>(endpoint)
    const nextCourses = normalizeImportedCourses(payload)
    if (!nextCourses.length) throw new Error('No courses were found in this repository.')
    const status = `${nextCourses.length} courses loaded from repository`
    await upsertRepositorySection(trimmedUrl, nextCourses, status)
    showToast(localizedRepositoryStatus(status), 'success')
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
    showToast(localizedRepositoryStatus(status), 'warning')
  }
}

async function addCourse(course: CourseSummary) {
  const savedCourse = await database.saveCourse({ ...course, progress: course.progress || 0 })
  courses.value = [...courses.value.filter(item => item.id !== savedCourse.id), savedCourse]
  if (!selectedCourseId.value) selectedCourseId.value = savedCourse.id
  const previousBadges = normalizeBadgeIds(profile.value.badges)
  profile.value = await database.saveProfile(profileWithBadges({
    ...profile.value,
    practiceStats: {
      ...normalizePracticeStats(profile.value.practiceStats),
      coursesAdded: normalizePracticeStats(profile.value.practiceStats).coursesAdded + 1
    }
  }, courses.value))
  normalizeBadgeIds(profile.value.badges)
    .filter(badge => !previousBadges.includes(badge))
    .forEach(badge => showToast(badgeUnlockedMessage(badge), 'success'))
  showToast(`${course.name} ${t('courseSavedToIndexedDb')}`, 'success')
}

function openCourse(course: CourseSummary, view: ViewName = 'map') {
  selectedCourseId.value = course.id
  const content = getCourseContent(course.id)
  selectedLessonIndex.value = Math.min(selectedLessonIndex.value, Math.max((content?.lessons.length || 1) - 1, 0))
  selectedExerciseIndex.value = 0
  dialoguePracticeIndex.value = 0
  restartDialogue()
  characterPromptIndex.value = 0
  characterTableIndex.value = 0
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
  dialoguePracticeIndex.value = 0
  restartDialogue()
  selectedVocabularyAnswer.value = ''
  vocabularyFeedback.value = 'idle'
  characterPromptIndex.value = 0
  characterTableIndex.value = 0
  selectedCharacterAnswer.value = ''
  characterFeedback.value = 'idle'
  characterAdvancing.value = false
}

function buildDraftSnapshot() {
  return {
    ...creatorDraft.value,
    lessons: creatorLessons.value.length,
    exercises: creatorLessons.value.reduce((total, lesson) => total + lesson.exercises.length, 0),
    words: Array.from(new Set(creatorLessons.value.flatMap(lesson => lesson.words.map(word => word.term)))),
    lessonData: creatorLessons.value,
    characterTables: creatorCharacterTables.value,
    validationIssues: creatorIssues.value,
    updatedAt: new Date().toISOString()
  }
}

function loadCreatorDraft(draft: CreatorDraft) {
  creatorDraft.value = draft
  creatorLessons.value = normalizeCreatorLessons(draft.lessonData, draft.words || [])
  creatorCharacterTables.value = normalizeCreatorCharacterTables(draft.characterTables)
  selectedCreatorLessonId.value = creatorLessons.value[0].id
  selectedCreatorExerciseId.value = creatorLessons.value[0].exercises[0]?.id || ''
  selectedCreatorDialogueId.value = creatorLessons.value[0].dialogues[0]?.id || ''
  selectedCreatorCharacterTableId.value = creatorCharacterTables.value[0]?.id || ''
}

function selectCreatorLesson(id: string) {
  selectedCreatorLessonId.value = id
  const lesson = creatorLessons.value.find(item => item.id === id) || creatorLessons.value[0]
  selectedCreatorExerciseId.value = lesson?.exercises[0]?.id || ''
  selectedCreatorDialogueId.value = lesson?.dialogues[0]?.id || ''
}

function selectCreatorExercise(id: string) {
  selectedCreatorExerciseId.value = id
}

function selectCreatorDialogue(id: string) {
  selectedCreatorDialogueId.value = id
}

function selectCreatorCharacterTable(id: string) {
  selectedCreatorCharacterTableId.value = id
}

function addCreatorCharacterTable() {
  const table: CreatorCharacterTable = {
    id: `character-table-${Date.now()}`,
    title: `Character Table ${creatorCharacterTables.value.length + 1}`,
    description: 'Practice this writing-system table.',
    characters: ['あ', 'い', 'う', 'え', 'お'],
    prompts: ['あ', 'い', 'う', 'え', 'お'].map(defaultCharacterPrompt)
  }
  creatorCharacterTables.value = [...creatorCharacterTables.value, table]
  selectedCreatorCharacterTableId.value = table.id
}

function removeCreatorCharacterTable(id: string) {
  creatorCharacterTables.value = creatorCharacterTables.value.filter(table => table.id !== id)
  if (selectedCreatorCharacterTableId.value === id) selectedCreatorCharacterTableId.value = creatorCharacterTables.value[0]?.id || ''
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
    lessonData: [{ id: `lesson-${Date.now()}`, title: 'Lesson 1', explanation: 'Write the lesson explanation here.', words: [], exercises: [createCreatorExercise('Choose the correct answer.')], dialogues: [] }],
    characterTables: [],
    validationIssues: [],
    updatedAt: new Date().toISOString()
  }
  creatorDrafts.value = [...creatorDrafts.value.map(item => item.id === creatorDraft.value.id ? buildDraftSnapshot() : item), draft]
  loadCreatorDraft(draft)
}

function startLesson(index: number) {
  if (!activeContent.value) {
    showToast(t('addCourseBeforeLessons'), 'warning')
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
  showToast(t('courseRemovedLocal'), 'info')
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
  showToast(t('libraryJsonExported'), 'success')
}

async function importLibrary(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const payload = JSON.parse(await file.text()) as LibraryImportPayload
    const importedCourses = normalizeImportedCourses(payload)
    for (const course of importedCourses) await addCourse(course)
    if (isRecord(payload) && 'profile' in payload && payload.profile) profile.value = await database.saveProfile(profileWithBadges(payload.profile as Profile, courses.value))
    if (isRecord(payload) && 'drafts' in payload && Array.isArray(payload.drafts) && payload.drafts[0]) creatorDraft.value = await database.saveDraft(payload.drafts[0] as CreatorDraft)
    if (isRecord(payload) && 'repositories' in payload && Array.isArray(payload.repositories)) {
      repositorySections.value = dedupeRepositorySections([
        ...payload.repositories.map(repositoryRecord => repositoryRecordToSection(repositoryRecord as RepositoryRecord)),
        ...repositorySections.value
      ])
      updateRepositoryStatus()
      await saveRepositorySections()
    }
    showToast(`${importedCourses.length} ${t('coursesImported')}`, 'success')
  }
  catch {
    showToast(t('importFailed'), 'warning')
  }
  input.value = ''
}

async function saveDraft() {
  const updatedDraft = buildDraftSnapshot()
  await database.saveDraft(updatedDraft)
  creatorDraft.value = updatedDraft
  creatorDrafts.value = [...creatorDrafts.value.filter(draft => draft.id !== updatedDraft.id), updatedDraft]
  showToast(t('draftSavedLocally'), 'success')
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
  const previousBadges = normalizeBadgeIds(profile.value.badges)
  const stats = normalizePracticeStats(profile.value.practiceStats)
  const dialogueExercisesCreated = creatorLessons.value.reduce((total, lesson) => total + lesson.dialogues.length, 0)
  profile.value = await database.saveProfile(profileWithBadges({
    ...profile.value,
    practiceStats: {
      ...stats,
      coursesAdded: wasAdded ? stats.coursesAdded : stats.coursesAdded + 1,
      creatorCourses: wasAdded ? stats.creatorCourses : stats.creatorCourses + 1,
      dialogueExercisesCreated: Math.max(stats.dialogueExercisesCreated, dialogueExercisesCreated)
    }
  }, courses.value))
  normalizeBadgeIds(profile.value.badges)
    .filter(badge => !previousBadges.includes(badge))
    .forEach(badge => showToast(badgeUnlockedMessage(badge), 'success'))
  selectPracticeCourse(savedCourse.id)
  showToast(`${savedCourse.name} ${t(wasAdded ? 'courseUpdatedInMyCourses' : 'courseAddedInMyCourses')}`, 'success')
}

function exportCourse() {
  const payload = courseExportPayload()
  downloadJson(`${payload.id}.json`, payload)
  showToast(t('courseJsonExported'), 'success')
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
      creatorLessons.value = normalizeCreatorLessons(payload.lessonData, payload.words || [])
      selectedCreatorLessonId.value = creatorLessons.value[0].id
      selectedCreatorExerciseId.value = creatorLessons.value[0].exercises[0]?.id || ''
      selectedCreatorDialogueId.value = creatorLessons.value[0].dialogues[0]?.id || ''
    }
    creatorCharacterTables.value = normalizeCreatorCharacterTables(payload.characterTables)
    selectedCreatorCharacterTableId.value = creatorCharacterTables.value[0]?.id || ''
    audioAttached.value = Boolean(payload.audioAttached)
    await saveDraft()
    creatorDrafts.value = [...creatorDrafts.value.filter(draft => draft.id !== creatorDraft.value.id), buildDraftSnapshot()]
  }
  catch {
    showToast(t('draftImportFailed'), 'warning')
  }
  input.value = ''
}

function addWord() {
  if (!selectedCreatorLesson.value) return
  const term = newWord.value.trim()
  if (!term || selectedCreatorLesson.value.words.some(word => word.term === term)) return
  selectedCreatorLesson.value.words = [...selectedCreatorLesson.value.words, { id: `word-${Date.now()}`, term, example: '' }]
  newWord.value = ''
}

function removeWord(id: string) {
  if (!selectedCreatorLesson.value) return
  selectedCreatorLesson.value.words = selectedCreatorLesson.value.words.filter(item => item.id !== id)
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
  if (exercise.type === 'sentence-order') exercise.orderItems = Array.from(new Set([...exercise.orderItems, chip]))
}

function setExerciseChipsFromInput(exercise: CreatorExercise, value: string) {
  exercise.chips = value.split('|').map(item => item.trim()).filter(Boolean)
}

function exerciseAnswerOptions(exercise: CreatorExercise) {
  const options = exercise.chips.length ? exercise.chips : [exercise.answer]
  return Array.from(new Set((options.includes(exercise.answer) ? options : [exercise.answer, ...options]).filter(Boolean)))
}

function setExerciseAnswerOptions(exercise: CreatorExercise, value: string) {
  exercise.chips = Array.from(new Set(value.split('|').map(option => option.trim()).filter(Boolean)))
  if (!exercise.chips.includes(exercise.answer)) exercise.answer = exercise.chips[0] || 'answer'
}

function setExerciseCorrectAnswer(exercise: CreatorExercise, answer: string) {
  exercise.answer = answer
  exercise.chips = exerciseAnswerOptions(exercise)
}

function addExerciseAnswerOption(exercise: CreatorExercise) {
  const option = window.prompt('Add answer option')?.trim()
  if (!option) return
  exercise.chips = Array.from(new Set([...exerciseAnswerOptions(exercise), option]))
}

function setOrderItemsFromInput(exercise: CreatorExercise, value: string) {
  exercise.orderItems = value.split('|').map(item => item.trim()).filter(Boolean)
  exercise.answer = exercise.orderItems.join(' ')
}

function setDialogueLinesFromInput(dialogue: CreatorDialogue, value: string) {
  const previousLines = dialogue.lines
  dialogue.lines = parseDialogueLines(value).map((line, index) => {
    const previousLine = previousLines[index]
    if (previousLine?.speaker === line.speaker && previousLine.text === line.text) return previousLine
    return line
  })
}

function dialogueLineOptions(line: DialogueLine) {
  const correctAnswer = line.correctAnswer || line.text
  const options = line.answerOptions?.length ? line.answerOptions : [line.text]
  return Array.from(new Set((options.includes(correctAnswer) ? options : [correctAnswer, ...options]).filter(Boolean)))
}

function setDialogueLineOptions(line: DialogueLine, value: string) {
  line.answerOptions = Array.from(new Set(value.split('|').map(option => option.trim()).filter(Boolean)))
  if (!line.answerOptions.includes(line.correctAnswer || line.text)) line.correctAnswer = line.answerOptions[0] || line.text
}

function setDialogueLineCorrectAnswer(line: DialogueLine, answer: string) {
  line.correctAnswer = answer
  line.answerOptions = dialogueLineOptions(line)
}

function addDialogueLineOption(line: DialogueLine) {
  const option = window.prompt('Add answer option')?.trim()
  if (!option) return
  line.answerOptions = Array.from(new Set([...dialogueLineOptions(line), option]))
}

function createDialogueLine(speaker: string, text: string, translation = ''): DialogueLine {
  return {
    speaker,
    text,
    translation,
    answerOptions: [text],
    correctAnswer: text
  }
}

function addDialogueExchange(dialogue: CreatorDialogue) {
  const partnerSpeaker = dialogue.speakerA === dialogue.learnerRole ? dialogue.speakerB : dialogue.speakerA
  const lastLine = dialogue.lines[dialogue.lines.length - 1]
  const nextLines = [...dialogue.lines]
  if (!lastLine || lastLine.speaker === dialogue.learnerRole) {
    nextLines.push(createDialogueLine(partnerSpeaker, '新しい質問です。', 'New prompt.'))
  }
  nextLines.push(createDialogueLine(dialogue.learnerRole, '新しい返答です。', 'New response.'))
  dialogue.lines = nextLines
}

async function awardPracticeXp(amount: number, label: string, origin?: XpOrigin) {
  await saveXpGain(amount, t(label as UiCopyKey), {}, origin)
}

async function awardVocabularyXp(origin?: XpOrigin) {
  const stats = normalizePracticeStats(profile.value.practiceStats)
  await saveXpGain(5, t('vocabulary'), {
    practiceStats: {
      ...stats,
      vocabularyCorrect: stats.vocabularyCorrect + 1
    }
  }, origin)
}

async function awardCharacterXp(origin?: XpOrigin) {
  const stats = normalizePracticeStats(profile.value.practiceStats)
  await saveXpGain(5, t('characters'), {
    practiceStats: {
      ...stats,
      characterCorrect: stats.characterCorrect + 1
    }
  }, origin)
}

function createCreatorExercise(title = 'New practice prompt'): CreatorExercise {
  return {
    id: `exercise-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    type: 'choice',
    prompt: title,
    sentence: '例文を入力します。',
    illustration: '',
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

function createCreatorDialogue(title = 'New dialogue'): CreatorDialogue {
  return {
    id: `dialogue-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    title,
    context: 'At a cafe counter.',
    speakerA: 'Staff',
    speakerB: 'Customer',
    learnerRole: 'Customer',
    lines: [
      { speaker: 'Staff', text: 'いらっしゃいませ。', translation: 'Welcome.' },
      { speaker: 'Customer', text: 'コーヒーをください。', translation: 'Coffee, please.', answerOptions: ['コーヒーをください。', '水をください。', 'すみません。'], correctAnswer: 'コーヒーをください。' },
      { speaker: 'Staff', text: 'ほかにご注文はありますか。', translation: 'Would you like anything else?' },
      { speaker: 'Customer', text: 'いいえ、以上です。', translation: 'No, that is all.', answerOptions: ['いいえ、以上です。', 'はい、どうぞ。', 'こんにちは。'], correctAnswer: 'いいえ、以上です。' }
    ]
  }
}

function addCreatorLesson() {
  const nextNumber = creatorLessons.value.length + 1
  const lesson: CreatorLesson = {
    id: `lesson-${Date.now()}`,
    title: `Lesson ${nextNumber}`,
    explanation: 'Write the lesson explanation here.',
    words: [],
    exercises: [createCreatorExercise('Choose the correct answer.')],
    dialogues: []
  }
  creatorLessons.value = [...creatorLessons.value, lesson]
  selectedCreatorLessonId.value = lesson.id
  selectedCreatorExerciseId.value = lesson.exercises[0]?.id || ''
  selectedCreatorDialogueId.value = ''
}

function removeCreatorLesson(id: string) {
  if (creatorLessons.value.length === 1) {
    showToast(t('courseNeedsLesson'), 'warning')
    return
  }
  creatorLessons.value = creatorLessons.value.filter(lesson => lesson.id !== id)
  selectedCreatorLessonId.value = creatorLessons.value[0].id
  selectedCreatorExerciseId.value = creatorLessons.value[0].exercises[0]?.id || ''
  selectedCreatorDialogueId.value = creatorLessons.value[0].dialogues[0]?.id || ''
}

function addCreatorExercise() {
  if (!selectedCreatorLesson.value) return
  const exercise = createCreatorExercise()
  selectedCreatorLesson.value.exercises.push(exercise)
  selectedCreatorExerciseId.value = exercise.id
}

function removeCreatorExercise(id: string) {
  if (!selectedCreatorLesson.value) return
  if (selectedCreatorLesson.value.exercises.length === 1) {
    showToast(t('lessonNeedsExercise'), 'warning')
    return
  }
  selectedCreatorLesson.value.exercises = selectedCreatorLesson.value.exercises.filter(exercise => exercise.id !== id)
  if (selectedCreatorExerciseId.value === id) selectedCreatorExerciseId.value = selectedCreatorLesson.value.exercises[0]?.id || ''
}

function moveCreatorExercise(id: string, direction: -1 | 1) {
  if (!selectedCreatorLesson.value) return
  const currentIndex = selectedCreatorLesson.value.exercises.findIndex(exercise => exercise.id === id)
  const nextIndex = currentIndex + direction
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= selectedCreatorLesson.value.exercises.length) return
  const nextExercises = [...selectedCreatorLesson.value.exercises]
  const [exercise] = nextExercises.splice(currentIndex, 1)
  nextExercises.splice(nextIndex, 0, exercise)
  selectedCreatorLesson.value.exercises = nextExercises
  selectedCreatorExerciseId.value = id
}

function addCreatorDialogue() {
  if (!selectedCreatorLesson.value) return
  const dialogue = createCreatorDialogue()
  selectedCreatorLesson.value.dialogues.push(dialogue)
  selectedCreatorDialogueId.value = dialogue.id
}

function removeCreatorDialogue(id: string) {
  if (!selectedCreatorLesson.value) return
  selectedCreatorLesson.value.dialogues = selectedCreatorLesson.value.dialogues.filter(dialogue => dialogue.id !== id)
  if (selectedCreatorDialogueId.value === id) selectedCreatorDialogueId.value = selectedCreatorLesson.value.dialogues[0]?.id || ''
}

function moveCreatorDialogue(id: string, direction: -1 | 1) {
  if (!selectedCreatorLesson.value) return
  const currentIndex = selectedCreatorLesson.value.dialogues.findIndex(dialogue => dialogue.id === id)
  const nextIndex = currentIndex + direction
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= selectedCreatorLesson.value.dialogues.length) return
  const nextDialogues = [...selectedCreatorLesson.value.dialogues]
  const [dialogue] = nextDialogues.splice(currentIndex, 1)
  nextDialogues.splice(nextIndex, 0, dialogue)
  selectedCreatorLesson.value.dialogues = nextDialogues
  selectedCreatorDialogueId.value = id
}

function attachAudio() {
  audioAttached.value = true
  showToast(t('audioRequirementComplete'), 'success')
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
  if (isLearnExercise.value) {
    lessonState.value = 'correct'
    showToast(t('cardRevealed'), 'success')
    return
  }
  const answer = isOrderingExercise.value ? orderedAnswer.value.join(' ') : selectedAnswer.value
  if (!answer) {
    showToast(t('chooseAnswerFirst'), 'warning')
    return
  }
  lessonState.value = answer === currentExercise.value.correctAnswer ? 'correct' : 'incorrect'
  if (lessonState.value === 'correct') showToast(t('correct'), 'success')
}

function checkVocabularyAnswer(answer = selectedVocabularyAnswer.value, origin?: XpOrigin) {
  if (vocabularyFeedback.value === 'correct') return
  selectedVocabularyAnswer.value = answer
  vocabularyFeedback.value = answer === activeVocabularyItem.value?.meaning ? 'correct' : 'incorrect'
  if (vocabularyFeedback.value === 'correct') void awardVocabularyXp(origin)
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

function nextDialogueItem() {
  dialoguePracticeIndex.value = nextPracticeIndex(dialoguePracticeIndex.value, dialogueItems.value.length, false)
  restartDialogue()
}

function restartDialogue() {
  dialogueQuestionIndex.value = 0
  selectedDialogueAnswer.value = ''
  dialogueFeedback.value = 'idle'
}

function selectDialogueItem(index: number) {
  dialoguePracticeIndex.value = index
  restartDialogue()
}

function selectDialogueAnswer(answer: string) {
  selectedDialogueAnswer.value = answer
  dialogueFeedback.value = answer === activeDialogueCorrectAnswer.value ? 'correct' : 'incorrect'
}

function continueDialogue() {
  if (dialogueFeedback.value !== 'correct') return
  if (dialogueQuestionIndex.value < dialogueLearnerLineIndexes.value.length - 1) {
    dialogueQuestionIndex.value += 1
    selectedDialogueAnswer.value = ''
    dialogueFeedback.value = 'idle'
    return
  }
  nextDialogueItem()
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
  const stats = normalizePracticeStats(profile.value.practiceStats)
  await saveXpGain(20, t('xpEarnedToastLabel'), {
    completedLessons: nextCompletedLessons,
    practiceStats: {
      ...stats,
      lessonsCompleted: Math.max(stats.lessonsCompleted, completedLessonCount({ ...profile.value, completedLessons: nextCompletedLessons }))
    }
  }, origin)
  const updatedCourses = await Promise.all(courses.value.map(course => {
    if (course.id !== selectedCourse.value?.id) return course
    const lessonStep = Math.ceil(100 / Math.max(selectedContent.value.lessons.length, 1))
    return database.saveCourse({ ...course, progress: Math.min(100, Math.max(course.progress, (selectedLessonIndex.value + 1) * lessonStep)) })
  }))
  courses.value = updatedCourses
  const previousBadges = normalizeBadgeIds(profile.value.badges)
  profile.value = await database.saveProfile(profileWithBadges(profile.value, courses.value))
  normalizeBadgeIds(profile.value.badges)
    .filter(badge => !previousBadges.includes(badge))
    .forEach(badge => showToast(badgeUnlockedMessage(badge), 'success'))

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
    void awardCharacterXp(xpOriginFromEvent(event))
    characterAdvancing.value = true
    window.setTimeout(() => {
      characterPromptIndex.value = nextPracticeIndex(characterPromptIndex.value, characterPrompts.value.length, randomCharacterPractice.value)
      selectedCharacterAnswer.value = ''
      characterFeedback.value = 'idle'
      characterAdvancing.value = false
    }, 650)
  }
  else {
    showToast(`${t('tryAgainCharacterReading')} ${activeCharacterPrompt.value?.character || 'き'} ${t('isReadAs')} ${correctAnswer}.`, 'warning')
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
          <span class="brand-subtitle">{{ t('brandSubtitle') }}</span>
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

        <article class="card card-accent exercise-card" :class="{ 'learn-card': isLearnExercise }" style="--accent: var(--zs-primary);">
          <template v-if="isLearnExercise">
            <div class="learn-illustration" aria-hidden="true">
              <img v-if="isImageIllustration(currentExercise.illustration)" :src="currentExercise.illustration" alt="" />
              <span v-else>{{ currentExercise.illustration || '✦' }}</span>
            </div>
            <p class="learn-word cjk">{{ currentExercise.sentence }}</p>
            <p v-if="currentExercise.reading" class="reading-line cjk">{{ currentExercise.reading }}</p>
            <Transition name="soft-appear" mode="out-in">
              <p v-if="lessonState === 'idle'" key="learn-hidden" class="muted learn-hidden-copy">{{ t('revealMeaningReady') }}</p>
              <div v-else key="learn-revealed" class="learn-meaning">
                <span>{{ t('meaning') }}</span>
                <strong>{{ currentExercise.translation || currentExercise.correctAnswer }}</strong>
              </div>
            </Transition>
          </template>
          <div v-else-if="currentExercise.type === 'fill-blank' && lessonState === 'idle'" class="sentence cjk" aria-label="Sentence with blank">
            <span>{{ currentExercise.blankBefore }}</span><span class="blank" /><span>{{ currentExercise.blankAfter }}</span>
          </div>
          <div v-else class="sentence cjk" aria-label="Exercise sentence">
            <span>{{ exerciseDisplaySentence || currentExercise.sentence }}</span>
          </div>
          <Transition v-if="!isLearnExercise" name="reading-reveal">
            <p v-if="currentExercise.reading && showAlternativeReading" class="reading-line cjk">{{ currentExercise.reading }}</p>
          </Transition>
          <p v-if="!isLearnExercise" class="muted" style="font-size: 1.25rem;">
            {{ currentExercise.type === 'translate' && lessonState === 'idle' ? t('selectBestAnswer') : currentExercise.translation }}
          </p>
          <div v-if="!isLearnExercise" class="exercise-tools">
            <button v-if="currentExercise.reading" class="ghost-button reading-toggle" @click="showAlternativeReading = !showAlternativeReading">
              <Icon name="material-symbols:visibility" /> {{ showAlternativeReading ? t('hideReading') : t('showReading') }}
            </button>
            <button class="primary-button audio-button" aria-label="Play audio">
              <Icon name="material-symbols:volume-up" size="1.5rem" />
            </button>
          </div>
        </article>

        <div v-if="isLearnExercise" class="learn-card-actions">
          <button v-if="lessonState === 'idle'" class="primary-button" @click="checkLessonAnswer"><Icon name="material-symbols:visibility" /> {{ t('revealMeaning') }}</button>
        </div>

        <div v-else-if="isOrderingExercise" class="ordering-builder">
          <div class="ordered-answer cjk" aria-label="Current ordered answer">
            <TransitionGroup name="order-chip-flow" tag="div" class="order-chip-flow">
              <button v-for="(item, index) in orderedAnswer" :key="`ordered-${item}-${index}`" class="order-chip selected" @click="removeOrderItem(index)">{{ item }}</button>
            </TransitionGroup>
            <span v-if="!orderedAnswer.length" class="muted">{{ t('tapChunksInOrder') }}</span>
          </div>
          <div class="order-chip-row cjk">
            <TransitionGroup name="order-chip-flow" tag="div" class="order-chip-flow">
              <button v-for="(item, index) in availableOrderItems" :key="`available-${item}-${index}`" class="order-chip" @click="addOrderItem(item)">{{ item }}</button>
            </TransitionGroup>
          </div>
        </div>

        <div v-else class="answer-grid lesson-answer-grid">
          <button v-for="answer in currentExercise.options" :key="answer" class="answer-button cjk" :class="{ selected: selectedAnswer === answer, correct: lessonState === 'correct' && answer === currentExercise.correctAnswer, incorrect: lessonState === 'incorrect' && selectedAnswer === answer }" @click="selectedAnswer = answer">
            {{ answer }}
          </button>
        </div>

        <div class="action-row" style="width: min(100%, 34rem); justify-content: space-between; margin-top: auto;">
          <button v-if="currentExercise.hint && !isLearnExercise" class="ghost-button hint-button" @click="lessonHintVisible = !lessonHintVisible">
            <Icon name="material-symbols:lightbulb" /> {{ t('hint') }}
          </button>
            <button class="primary-button" @click="continueLesson($event)">
              {{ lessonState === 'correct' ? t('continueCourse') : lessonState === 'incorrect' ? t('tryAgain') : isLearnExercise ? t('reveal') : t('check') }} <Icon name="material-symbols:arrow-forward" />
          </button>
        </div>

          <Transition name="soft-appear">
            <article v-if="!isLearnExercise && ((lessonHintVisible && currentExercise.hint) || lessonState !== 'idle')" :class="['feedback-card', lessonState]">
              <strong>{{ lessonState === 'correct' ? t('correct') : lessonState === 'incorrect' ? t('notQuite') : t('hint') }}</strong>
              <span>{{ lessonState === 'correct' ? currentExercise.correctAnswer : lessonState === 'incorrect' ? `${t('correctAnswerLabel')}: ${currentExercise.correctAnswer}` : currentExercise.hint }}</span>
            </article>
          </Transition>
      </section>
    </main>

    <aside class="lesson-aside">
      <Transition name="lesson-aside-reveal" mode="out-in">
        <div v-if="lessonState === 'idle'" key="locked" class="lesson-aside-placeholder card">
          <Icon name="material-symbols:lock" />
          <strong>{{ t('checkToReveal') }}</strong>
          <span class="muted">{{ t('revealUnlocks') }}</span>
        </div>
        <div v-else key="revealed" class="lesson-aside-content">
          <h2><Icon name="material-symbols:menu-book" class="success-icon" /> {{ t('grammarNoteLabel') }}</h2>
          <article class="card" style="border-left: 4px solid var(--zs-primary);">
            <h3 style="color: var(--zs-primary);">{{ currentExercise.grammarTitle }}</h3>
            <p class="muted">{{ currentExercise.grammarNote }}</p>
            <div class="tag cjk">{{ currentExercise.correctAnswer }}</div>
          </article>
          <article class="card">
            <p class="eyebrow">{{ t('exampleSentence') }}</p>
            <p class="cjk" style="font-size: 1.25rem;">{{ currentExercise.example }}</p>
            <p v-if="currentExercise.exampleReading && showAlternativeReading" class="reading-line cjk">{{ currentExercise.exampleReading }}</p>
            <p class="muted">{{ currentExercise.exampleTranslation }}</p>
          </article>
          <article class="validation-card warning">
            <strong>{{ t('readingHint') }}</strong>
            <span class="muted">{{ t('particleHint') }}</span>
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
      <button class="primary-button" @click="database.saveProfile(profile); showToast(t('settingsSaved'), 'success')"><Icon name="material-symbols:save" /> {{ t('saveSettings') }}</button>
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
          <span class="brand-subtitle">{{ t('brandSubtitle') }}</span>
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
                <div class="action-row" style="justify-content: space-between;"><span>{{ t('progress') }}</span><strong>{{ course.progress }}%</strong></div>
                <div class="progress-track"><div class="progress-fill" :style="{ width: `${course.progress}%` }" /></div>
              </div>
              <div class="action-row" style="justify-content: space-between;">
                <span class="cjk" style="font-size: 1.75rem;">{{ course.id.includes('hiragana') ? 'あいうえお' : 'こんにちは' }}</span>
                <button class="primary-button" @click="openCourse(course, course.id.includes('hiragana') ? 'characters' : 'map')">{{ course.id.includes('hiragana') ? t('practice') : t('continueCourse') }}</button>
              </div>
            </article>
          </div>
          <article v-else class="card empty-state">
            <Icon name="material-symbols:menu-book" />
            <strong>{{ t('noLocalCoursesYet') }}</strong>
            <span class="muted">{{ t('addCourseFromRepository') }}</span>
            <button class="primary-button" @click="switchView('repository')">{{ t('courses') }}</button>
          </article>
        </section>

        <section class="panel card">
          <h2>{{ t('dailyGoal') }}</h2>
          <p class="muted">{{ profile.dailyXp }} {{ t('of') }} {{ profile.dailyGoal }} {{ t('xpEarnedToday') }}</p>
          <div class="progress-track"><div class="progress-fill" :style="{ width: `${dailyProgress}%` }" /></div>
        </section>

        <section class="panel card">
          <h2>{{ t('recentAchievements') }}</h2>
          <div class="chip-row">
            <span v-for="badge in allBadges" :key="badge.id" class="tag" :class="{ locked: !badge.earned }"><Icon :name="badge.icon" /> {{ t(badge.labelKey) }}</span>
          </div>
        </section>
      </div>

      <div v-else-if="currentView === 'profile'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <p class="eyebrow">{{ t('profile') }}</p>
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
              <h2>{{ t('runningCourses') }}</h2>
              <span class="status-pill">{{ runningCourses.length }}</span>
            </div>
            <div v-if="runningCourses.length" class="profile-course-list">
              <button v-for="course in runningCourses" :key="course.id" class="profile-course-row" @click="openCourse(course, 'map')">
                <span><strong>{{ course.name }}</strong><small>{{ courseCompletion[course.id]?.completedCount || 0 }} / {{ courseCompletion[course.id]?.lessonCount || course.stats.lessons }} {{ t('lessons') }}</small></span>
                <span class="profile-progress"><span>{{ courseCompletion[course.id]?.progress || course.progress }}%</span><span class="progress-track"><span class="progress-fill" :style="{ width: `${courseCompletion[course.id]?.progress || course.progress}%` }" /></span></span>
              </button>
            </div>
            <p v-else class="muted">{{ t('noCoursesInProgress') }}</p>
          </article>

          <article class="card profile-panel">
            <div class="action-row" style="justify-content: space-between;">
              <h2>{{ t('completedCourses') }}</h2>
              <span class="status-pill success">{{ completedCourses.length }}</span>
            </div>
            <div v-if="completedCourses.length" class="profile-course-list">
              <button v-for="course in completedCourses" :key="course.id" class="profile-course-row" @click="openCourse(course, 'map')">
                <span><strong>{{ course.name }}</strong><small>{{ courseCompletion[course.id]?.lessonCount || course.stats.lessons }} {{ t('lessonsCompleted') }}</small></span>
                <Icon name="material-symbols:check-circle" style="color: var(--zs-primary);" />
              </button>
            </div>
            <p v-else class="muted">{{ t('completedCoursesAppear') }}</p>
          </article>
        </section>

        <section class="card profile-panel">
          <div class="action-row" style="justify-content: space-between;">
            <h2>{{ t('recentAchievements') }}</h2>
            <span class="status-pill">{{ earnedBadges.length }} / {{ allBadges.length }}</span>
          </div>
          <div class="badge-grid">
            <article v-for="badge in allBadges" :key="badge.id" class="badge-card" :class="{ locked: !badge.earned }">
              <Icon :name="badge.icon" />
              <span>
                <strong>{{ t(badge.labelKey) }}</strong>
                <small>{{ t(badge.descriptionKey) }}</small>
              </span>
            </article>
          </div>
        </section>
      </div>

      <div v-else-if="currentView === 'repository'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <h1>{{ t('repository') }}</h1>
            <p class="muted"><Icon name="material-symbols:database" /> {{ t('localFirstCompatible') }}</p>
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
          <input v-model="repositoryUrl" class="input" :aria-label="t('repositoryUrlLabel')" :placeholder="t('repositoryUrlPlaceholder')" />
          <button class="secondary-button" @click="fetchRepository()"><Icon name="material-symbols:sync" /> {{ t('fetch') }}</button>
          <button class="primary-button" @click="addAllCourses"><Icon name="material-symbols:add" /> {{ t('addAll') }}</button>
        </div>
        <label class="filter-toggle">
          <input v-model="showOnlyNonAdded" type="checkbox" />
          <span>{{ t('showOnlyNonAdded') }}</span>
        </label>
        <p class="repo-status"><Icon name="material-symbols:info" /> {{ localizedRepositoryStatus(repositoryStatus) }} · {{ countLabel(totalDownloaded, 'localCourse', 'localCourses') }}</p>

        <section class="repository-section-list">
          <article v-for="section in visibleRepositorySections" :key="section.id" class="card repository-section-card">
            <button class="repository-section-header" @click="toggleRepositorySection(section.id)">
              <span><Icon :name="section.expanded ? 'material-symbols:expand-more' : 'material-symbols:chevron-right'" /> {{ section.url }}</span>
              <span class="status-pill">{{ countLabel(section.courses.length, 'courseSingular', 'coursePlural') }}</span>
            </button>
            <p class="repo-status"><Icon name="material-symbols:info" /> {{ localizedRepositoryStatus(section.status) }}</p>
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
                      <span><strong>{{ course.stats.words }}</strong> {{ t('wordsUnit') }}</span>
                      <span><strong>{{ course.stats.sentences }}</strong> {{ t('sentencesUnit') }}</span>
                      <span><strong>{{ course.stats.dialogues }}</strong> {{ t('dialoguesUnit') }}</span>
                      <span><strong>{{ course.stats.characterTables }}</strong> {{ t('tablesUnit') }}</span>
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
                  <strong>{{ t('noVisibleCourses') }}</strong>
                  <span>{{ t('tryDisablingNonAddedFilter') }}</span>
                </article>
              </div>
            </Transition>
          </article>
        </section>
      </div>

      <div v-else-if="currentView === 'map'" class="page-inner">
        <header class="page-header">
          <button class="ghost-button" @click="switchView('repository')"><Icon name="material-symbols:arrow-back" /> {{ t('courses') }}</button>
          <div class="map-header-controls">
            <Select v-if="activeCourses.length" class="course-select" :model-value="activeCourse?.id" :options="activeCourses" option-label="name" option-value="id" @update:model-value="selectPracticeCourse($event)" />
            <span class="status-pill success"><Icon name="material-symbols:local-fire-department" /> {{ profile.streak }} {{ t('dayStreak') }}</span>
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
                <h3>{{ t('lessonLabel') }} {{ index + 1 }}: {{ lesson.title }}</h3>
                <p class="eyebrow">{{ lesson.unitTitle }}</p>
                <p class="muted">{{ lesson.description }}</p>
                <div class="map-lesson-actions">
                  <span v-if="completedLessonSet.has(lesson.id)" class="status-pill success map-status-pill"><Icon name="material-symbols:check-circle" /> {{ t('completed') }}</span>
                  <button class="secondary-button compact-button" :disabled="lesson.locked" @click="startLesson(index)"><Icon name="material-symbols:play-arrow" /> {{ t('play') }}</button>
                </div>
              </article>
            </div>
          </div>
          <button class="primary-button map-start-button" @click="startLesson(selectedLessonIndex)">{{ t('start') }} {{ selectedLesson.title }} <Icon name="material-symbols:play-arrow" /></button>
        </section>
        <section v-else class="card empty-state">
          <Icon name="material-symbols:download" />
          <h2>{{ t('noAddedCourse') }}</h2>
          <p>{{ t('addCourseFromRepository') }}</p>
          <button class="primary-button" @click="switchView('repository')"><Icon name="material-symbols:add" /> {{ t('browseCourses') }}</button>
        </section>
      </div>

      <div v-else-if="currentView === 'characters'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <h1>{{ t('characterTablePractice') }}</h1>
            <p class="muted">{{ t('practiceCharactersFromCourse') }}</p>
          </div>
          <Select v-if="characterCourseOptions.length" class="course-select" :model-value="activeCourse?.id" :options="characterCourseOptions" option-label="name" option-value="id" @update:model-value="selectPracticeCourse($event)" />
        </header>
        <section v-if="!characterCourseOptions.length" class="card empty-state">
          <Icon name="material-symbols:table-chart" />
          <h2>{{ t('noCharacterTables') }}</h2>
          <p>{{ t('addCharacterCourse') }}</p>
          <button class="primary-button" @click="switchView('repository')"><Icon name="material-symbols:add" /> {{ t('browseCourses') }}</button>
        </section>
        <template v-else-if="activeCourse && activeContent && characterPrompts.length">
        <section class="practice-toolbar card">
          <strong>{{ randomCharacterPractice ? t('randomPractice') : t('sequentialPractice') }}</strong>
          <Select v-if="characterTables.length > 1" class="course-select" :model-value="activeCharacterTable?.id" :options="characterTables" option-label="title" option-value="id" @update:model-value="characterTableIndex = Math.max(characterTables.findIndex(table => table.id === $event), 0); characterPromptIndex = 0; selectedCharacterAnswer = ''; characterFeedback = 'idle'" />
          <label class="toggle-row"><span>{{ t('random') }}</span><ToggleSwitch v-model="randomCharacterPractice" /></label>
        </section>
        <section class="grid-2">
          <article class="card card-accent" style="--accent: var(--zs-primary);">
            <h2>{{ activeCourse.name }}</h2>
            <p v-if="activeCharacterTable" class="muted">{{ activeCharacterTable.title }}</p>
            <div class="char-grid cjk">
              <button v-for="char in activeCharacterList" :key="char" class="char-cell" :class="{ active: char === activeCharacterPrompt?.character }">{{ char }}</button>
            </div>
          </article>
          <article class="card">
            <p class="eyebrow">{{ t('prompt') }}</p>
            <h2>{{ t('chooseReadingFor') }} <span class="cjk">{{ activeCharacterPrompt?.character || 'き' }}</span></h2>
            <div class="answer-grid" style="grid-template-columns: repeat(2, 1fr); width: 100%;">
              <button v-for="answer in activeCharacterPrompt?.answers || ['ka', 'ki', 'ku', 'ke']" :key="answer" class="answer-button" :class="{ selected: selectedCharacterAnswer === answer, correct: characterFeedback === 'correct' && answer === activeCharacterPrompt?.correctAnswer, incorrect: characterFeedback === 'incorrect' && selectedCharacterAnswer === answer }" :disabled="characterAdvancing" @click="selectedCharacterAnswer = answer">{{ answer }}</button>
            </div>
            <button class="primary-button" style="margin-top: 1.5rem;" :disabled="characterAdvancing || !selectedCharacterAnswer" @click="checkCharacterAnswer(selectedCharacterAnswer, $event)">{{ t('check') }}</button>
            <Transition name="soft-appear">
              <p v-if="characterFeedback !== 'idle'" :class="['feedback-text', characterFeedback]">
                {{ characterReadingMessage(characterFeedback, activeCharacterPrompt?.character || 'き', activeCharacterPrompt?.correctAnswer || 'ki') }}
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
          <p>{{ t('addCourseBeforeVocab') }}</p>
          <button class="primary-button" @click="switchView('repository')"><Icon name="material-symbols:add" /> {{ t('browseCourses') }}</button>
        </section>
        <section v-else-if="!vocabularyItems.length" class="card empty-state">
          <Icon name="material-symbols:style" />
          <h2>{{ t('noVocabularyYet') }}</h2>
          <p>{{ t('noCourseVocabulary') }}</p>
          <button class="secondary-button" @click="switchView('creator')"><Icon name="material-symbols:edit-note" /> {{ t('addWordsInCreator') }}</button>
        </section>
        <template v-else>
          <section class="practice-toolbar card">
            <strong>{{ randomVocabularyPractice ? t('randomPractice') : t('sequentialPractice') }}</strong>
            <label class="toggle-row"><span>{{ t('random') }}</span><ToggleSwitch v-model="randomVocabularyPractice" /></label>
          </section>
          <section class="grid-2">
            <article class="card card-accent vocab-card" style="--accent: var(--zs-primary);">
              <p class="eyebrow">{{ t('term') }}</p>
              <h2 class="cjk">{{ activeVocabularyItem.term }}</h2>
              <p v-if="activeVocabularyItem.reading" class="reading-line cjk">{{ activeVocabularyItem.reading }}</p>
              <p v-if="activeVocabularyItem.example" class="muted cjk">{{ activeVocabularyItem.example }}</p>
            </article>
            <article class="card">
              <p class="eyebrow">{{ t('meaning') }}</p>
              <h2>{{ t('chooseCorrectMeaning') }}</h2>
              <div class="answer-grid" style="grid-template-columns: repeat(2, 1fr); width: 100%;">
                <button v-for="answer in vocabularyOptions" :key="answer" class="answer-button" :class="{ selected: selectedVocabularyAnswer === answer, correct: vocabularyFeedback === 'correct' && answer === activeVocabularyItem.meaning, incorrect: vocabularyFeedback === 'incorrect' && selectedVocabularyAnswer === answer }" @click="selectedVocabularyAnswer = answer">{{ answer }}</button>
              </div>
              <button class="primary-button" style="margin-top: 1.5rem;" :disabled="!selectedVocabularyAnswer" @click="nextVocabularyItem($event)">
                {{ vocabularyFeedback === 'correct' ? t('nextWord') : t('check') }} <Icon name="material-symbols:arrow-forward" />
              </button>
              <Transition name="soft-appear">
                <p v-if="vocabularyFeedback !== 'idle'" :class="['feedback-text', vocabularyFeedback]">
                  {{ vocabularyFeedback === 'correct' ? t('correct') : `${t('notQuite')} ${activeVocabularyItem.term} means ${activeVocabularyItem.meaning}.` }}
                </p>
              </Transition>
            </article>
          </section>
        </template>
      </div>

      <div v-else-if="currentView === 'dialogues'" class="page-inner section-stack">
        <header class="page-header">
          <div>
            <h1>{{ t('dialoguePractice') }}</h1>
            <p class="muted">{{ t('practiceDialoguesFromCourse') }}</p>
          </div>
          <Select v-if="dialogueCourseOptions.length" class="course-select" :model-value="activeCourse?.id" :options="dialogueCourseOptions" option-label="name" option-value="id" @update:model-value="selectPracticeCourse($event)" />
        </header>
        <section v-if="!activeCourses.length" class="card empty-state">
          <Icon name="material-symbols:forum" />
          <h2>{{ t('noAddedCourse') }}</h2>
          <p>{{ t('addCourseBeforeDialogues') }}</p>
          <button class="primary-button" @click="switchView('repository')"><Icon name="material-symbols:add" /> {{ t('browseCourses') }}</button>
        </section>
        <section v-else-if="!dialogueItems.length" class="card empty-state">
          <Icon name="material-symbols:forum" />
          <h2>{{ t('noDialoguesYet') }}</h2>
          <p>{{ t('noCourseDialogues') }}</p>
          <button class="secondary-button" @click="switchView('creator')"><Icon name="material-symbols:edit-note" /> {{ t('addDialoguesInCreator') }}</button>
        </section>
        <section v-else-if="activeDialogueItem" class="grid-2">
          <article class="card card-accent" style="--accent: var(--zs-secondary);">
            <p class="eyebrow">{{ activeCourse?.name }}</p>
            <h2>{{ t('dialogues') }}</h2>
            <div class="dialogue-title-list">
              <button v-for="(dialogue, index) in dialogueItems" :key="dialogue.id" class="dialogue-title-button" :class="{ active: dialogue.id === activeDialogueItem.id }" @click="selectDialogueItem(index)">
                <strong>{{ dialogue.title }}</strong>
                <span>{{ dialogue.context }}</span>
              </button>
            </div>
          </article>
          <article class="card dialogue-practice-card">
            <p class="eyebrow">{{ activeDialogueItem.title }}</p>
            <h2>{{ activeDialoguePromptLine?.speaker || activeDialogueItem.speakerA }}</h2>
            <p v-if="activeDialoguePromptLine" class="dialogue-prompt cjk">{{ activeDialoguePromptLine.text }}<small v-if="activeDialoguePromptLine.translation" class="muted">{{ activeDialoguePromptLine.translation }}</small></p>
            <p v-else class="muted">{{ activeDialogueItem.context }}</p>
            <div class="chip-row" style="margin-top: 1rem;">
              <span class="tag"><Icon name="material-symbols:record-voice-over" /> {{ activeDialogueItem.speakerA }}</span>
              <span class="tag"><Icon name="material-symbols:person" /> {{ activeDialogueItem.speakerB }}</span>
              <span class="tag"><Icon name="material-symbols:school" /> {{ t('learnerRole') }}: {{ activeDialogueItem.learnerRole }}</span>
            </div>
            <div class="dialogue-line-list">
              <p v-for="line in completedDialogueLines" :key="`${activeDialogueItem.id}-${line.speaker}-${line.text}`" class="dialogue-line cjk" :class="{ 'learner-turn': line.speaker === activeDialogueItem.learnerRole }">
                <strong>{{ line.speaker }}</strong>
                <span>{{ line.text }}<small v-if="line.translation" class="muted">{{ line.translation }}</small></span>
              </p>
            </div>
            <div v-if="activeDialogueAnswerLine" class="dialogue-answer-area">
              <p class="eyebrow">{{ activeDialogueItem.learnerRole }}</p>
              <div class="answer-grid dialogue-answer-grid">
                <button v-for="option in dialogueAnswerOptions" :key="option" class="answer-button cjk" :class="{ selected: selectedDialogueAnswer === option, correct: selectedDialogueAnswer === option && dialogueFeedback === 'correct', incorrect: selectedDialogueAnswer === option && dialogueFeedback === 'incorrect' }" @click="selectDialogueAnswer(option)">
                  {{ option }}
                </button>
              </div>
            </div>
            <div class="action-row" style="margin-top: 1.5rem;">
              <button class="primary-button" :disabled="dialogueFeedback !== 'correct'" @click="continueDialogue">
                {{ dialogueFinished ? t('nextDialogue') : t('continueCourse') }} <Icon name="material-symbols:arrow-forward" />
              </button>
              <button class="secondary-button" @click="restartDialogue"><Icon name="material-symbols:replay" /> {{ t('tryAgain') }}</button>
            </div>
          </article>
        </section>
      </div>

      <div v-else-if="currentView === 'creator'" class="creator-layout">
        <section class="creator-canvas section-stack">
          <section class="card creator-course-picker">
            <label class="eyebrow" for="creator-course-select">{{ t('courseDraft') }}</label>
            <Select input-id="creator-course-select" :model-value="creatorDraft.id" :options="creatorDrafts" option-label="title" option-value="id" @update:model-value="selectCreatorDraft($event)" />
            <button class="secondary-button" @click="createCreatorDraft"><Icon name="material-symbols:add" /> {{ t('newCourse') }}</button>
          </section>

          <section class="card creator-meta-editor">
            <div>
              <p class="eyebrow">{{ t('courseEditor') }} <span class="tag">{{ t('draft') }}</span></p>
              <label class="creator-field-label" for="creator-course-title">{{ t('courseTitle') }}</label>
              <input id="creator-course-title" v-model="creatorDraft.title" class="title-input" :aria-label="t('courseTitle')" />
              <label class="creator-field-label" for="creator-course-description">{{ t('courseDescription') }}</label>
              <textarea id="creator-course-description" v-model="creatorDraft.description" class="description-input" :aria-label="t('courseDescription')" />
              <div class="field-grid language-select-grid">
                <label><span class="eyebrow">{{ t('sourceLanguage') }}</span>
                  <Select v-model="creatorDraft.sourceLanguage" :options="courseLanguageOptions" option-label="label" option-value="value">
                    <template #value="slotProps">
                      <span class="language-option"><Icon :name="selectedLanguageOption(slotProps.value)?.flag || languageFlagIcon(String(slotProps.value || ''))" /> {{ selectedLanguageOption(slotProps.value)?.label || languageLabel(String(slotProps.value || '')) }}</span>
                    </template>
                    <template #option="slotProps">
                      <span class="language-option"><Icon :name="slotProps.option.flag" /> {{ slotProps.option.label }}</span>
                    </template>
                  </Select>
                </label>
                <label><span class="eyebrow">{{ t('targetLanguage') }}</span>
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
              <button class="primary-button" @click="addCreatorDraftToCourses"><Icon name="material-symbols:playlist-add" /> {{ isCreatorDraftAdded ? t('updateMyCourse') : t('addToMyCourses') }}</button>
              <button class="secondary-button" :disabled="!isCreatorDraftAdded" @click="openCourse(courses.find(course => course.id === creatorDraft.id) || draftToCourseSummary(buildDraftSnapshot()), 'map')"><Icon name="material-symbols:route" /> {{ t('testPlay') }}</button>
              <button class="secondary-button" @click="showJsonView = !showJsonView"><Icon name="material-symbols:data-object" /> {{ t('jsonView') }}</button>
              <button class="secondary-button" @click="saveDraft">{{ t('saveDraft') }}</button>
              <label class="secondary-button file-button">
                <Icon name="material-symbols:upload-file" /> {{ t('importCourse') }}
                <input type="file" accept="application/json" class="sr-only" @change="importCourseDraft" />
              </label>
              <button class="primary-button" @click="exportCourse"><Icon name="material-symbols:publish" /> {{ t('exportCourse') }}</button>
            </div>
          </section>

          <pre v-if="showJsonView" class="json-panel">{{ creatorJson }}</pre>

          <section class="card creator-lesson-list">
            <div class="action-row" style="justify-content: space-between;">
              <h2>{{ t('lessons') }}</h2>
              <button class="primary-button" @click="addCreatorLesson"><Icon name="material-symbols:add" /> {{ t('addLesson') }}</button>
            </div>
            <div class="lesson-tabs">
              <button v-for="(lesson, index) in creatorLessons" :key="lesson.id" class="secondary-button" :class="{ selected: lesson.id === selectedCreatorLessonId }" @click="selectCreatorLesson(lesson.id)">
                {{ t('lessonLabel') }} {{ index + 1 }} · {{ lesson.title }}
              </button>
            </div>
          </section>

          <div class="editor-grid">
            <article v-if="selectedCreatorLesson" class="card card-accent" style="--accent: var(--zs-primary);">
              <div class="action-row" style="justify-content: space-between; align-items: flex-start;">
                <h2><Icon name="material-symbols:menu-book" class="success-icon" /> {{ t('lessonEditor') }}</h2>
                <button class="ghost-button danger-button" @click="removeCreatorLesson(selectedCreatorLesson.id)"><Icon name="material-symbols:delete" /> {{ t('remove') }}</button>
              </div>
              <label class="eyebrow" for="creator-lesson-title">{{ t('lessonTitle') }}</label>
              <input id="creator-lesson-title" v-model="selectedCreatorLesson.title" class="input" />
              <label class="eyebrow" for="lesson-explanation" style="margin-top: 1rem;">{{ t('explanationText') }}</label>
              <textarea id="lesson-explanation" v-model="selectedCreatorLesson.explanation" class="textarea" />
            </article>
            <article v-if="selectedCreatorLesson" class="card card-accent" style="--accent: var(--zs-primary);">
              <h2><Icon name="material-symbols:translate" /> {{ t('targetVocab') }}</h2>
              <div class="vocab-entry-list">
                <article v-for="word in selectedCreatorLesson.words" :key="word.id" class="vocab-entry-row">
                  <label><span class="eyebrow">{{ t('word') }}</span><input v-model="word.term" class="input cjk" /></label>
                  <label><span class="eyebrow">{{ t('exampleSentence') }}</span><input v-model="word.example" class="input cjk" /></label>
                  <button class="ghost-button danger-button compact-button" :aria-label="`${t('remove')} ${word.term}`" @click="removeWord(word.id)"><Icon name="material-symbols:delete" /></button>
                </article>
                <div class="inline-form">
                  <input v-model="newWord" class="input" :placeholder="t('newVocabulary')" @keydown.enter.prevent="addWord" />
                  <button class="secondary-button" @click="addWord"><Icon name="material-symbols:add" /> {{ t('addWord') }}</button>
                </div>
              </div>
            </article>
            <article class="card card-accent" style="--accent: var(--zs-secondary);">
              <div class="action-row" style="justify-content: space-between;">
                <h2><Icon name="material-symbols:table-chart" style="color: var(--zs-secondary);" /> {{ t('characterTablePractice') }}</h2>
                <button class="secondary-button" @click="addCreatorCharacterTable"><Icon name="material-symbols:add" /> {{ t('add') }} {{ t('tablesUnit') }}</button>
              </div>
              <div class="lesson-tabs" style="margin-top: 1rem;">
                <button v-for="table in creatorCharacterTables" :key="table.id" class="secondary-button" :class="{ selected: table.id === selectedCreatorCharacterTableId }" @click="selectCreatorCharacterTable(table.id)">
                  {{ table.title }} · {{ table.characters.length }} {{ t('characters') }}
                </button>
              </div>
              <article v-if="selectedCreatorCharacterTable" class="exercise-editor" style="margin-top: 1rem;">
                <div class="action-row" style="justify-content: space-between;">
                  <strong>{{ selectedCreatorCharacterTable.title }}</strong>
                  <button class="ghost-button danger-button" @click="removeCreatorCharacterTable(selectedCreatorCharacterTable.id)"><Icon name="material-symbols:delete" /> {{ t('remove') }}</button>
                </div>
                <div class="field-grid">
                  <label><span class="eyebrow">{{ t('courseTitle') }}</span><input v-model="selectedCreatorCharacterTable.title" class="input" /></label>
                  <label><span class="eyebrow">{{ t('courseDescription') }}</span><input v-model="selectedCreatorCharacterTable.description" class="input" /></label>
                </div>
                <label><span class="eyebrow">{{ t('characters') }}</span><textarea :value="characterListToText(selectedCreatorCharacterTable.characters)" class="textarea cjk" @input="setCharacterTableCharacters(selectedCreatorCharacterTable, ($event.target as HTMLTextAreaElement).value)" /></label>
                <small class="muted">{{ t('charactersHelp') }}</small>
                <div class="action-row">
                  <input v-model="characterTableCharacterInput" class="input cjk" :placeholder="t('characterPlaceholder')" @keyup.enter="addCharactersToTable(selectedCreatorCharacterTable)" />
                  <button class="secondary-button" @click="addCharactersToTable(selectedCreatorCharacterTable)"><Icon name="material-symbols:add" /> {{ t('addCharacter') }}</button>
                </div>
                <div class="char-grid cjk compact-char-grid">
                  <span v-for="character in selectedCreatorCharacterTable.characters" :key="character" class="char-cell">{{ character }}</span>
                </div>
                <div class="dialogue-answer-editor-list character-answer-editor-list">
                  <article v-for="character in selectedCreatorCharacterTable.characters" :key="`prompt-${character}`" class="dialogue-answer-editor">
                    <div class="action-row" style="justify-content: space-between;">
                      <strong class="cjk" style="font-size: 1.5rem;">{{ character }}</strong>
                      <span class="status-pill">{{ characterPromptFor(selectedCreatorCharacterTable, character).correctAnswer }}</span>
                    </div>
                    <label>
                      <span class="eyebrow">{{ t('answerOptions') }}</span>
                      <input class="input" :value="characterPromptFor(selectedCreatorCharacterTable, character).answers.join(' | ')" @input="setCharacterPromptOptions(characterPromptFor(selectedCreatorCharacterTable, character), ($event.target as HTMLInputElement).value)" />
                    </label>
                    <div class="dialogue-correct-options">
                      <span class="eyebrow">{{ t('correctAnswer') }}</span>
                      <label v-for="answer in characterPromptFor(selectedCreatorCharacterTable, character).answers" :key="answer" class="dialogue-correct-option">
                        <input type="radio" :name="`${selectedCreatorCharacterTable.id}-${character}-correct`" :checked="characterPromptFor(selectedCreatorCharacterTable, character).correctAnswer === answer" @change="setCharacterPromptCorrectAnswer(characterPromptFor(selectedCreatorCharacterTable, character), answer)" />
                        <span>{{ answer }}</span>
                      </label>
                    </div>
                    <button class="ghost-button" @click="addCharacterPromptOption(characterPromptFor(selectedCreatorCharacterTable, character))"><Icon name="material-symbols:add" /> {{ t('option') }}</button>
                  </article>
                </div>
              </article>
              <div v-else class="validation-card compact-validation-card" style="margin-top: 1rem;">
                <strong>{{ t('noCharacterTables') }}</strong>
                <span class="muted">{{ t('addCharacterCourse') }}</span>
              </div>
            </article>
          </div>

          <article v-if="selectedCreatorLesson" class="card card-accent" style="--accent: var(--zs-primary);">
            <div class="action-row" style="justify-content: space-between;">
              <h2><Icon name="material-symbols:quiz" style="color: var(--zs-primary);" /> {{ t('practiceExercises') }}</h2>
              <button class="secondary-button" @click="addCreatorExercise"><Icon name="material-symbols:add" /> {{ t('addExercise') }}</button>
            </div>
            <div class="exercise-workspace">
              <aside class="exercise-sidebar" :aria-label="t('practiceExercises')">
                <article v-for="(exercise, index) in selectedCreatorLesson.exercises" :key="exercise.id" class="exercise-list-item" :class="{ active: exercise.id === selectedCreatorExercise?.id }" role="button" tabindex="0" @click="selectCreatorExercise(exercise.id)" @keydown.enter.prevent="selectCreatorExercise(exercise.id)" @keydown.space.prevent="selectCreatorExercise(exercise.id)">
                  <span class="exercise-list-heading">
                    <span class="exercise-list-title">{{ t('exerciseLabel') }} {{ index + 1 }}</span>
                    <span class="exercise-reorder-controls">
                      <button class="ghost-button compact-button" :disabled="index === 0" :aria-label="t('moveExerciseUp')" @click.stop="moveCreatorExercise(exercise.id, -1)"><Icon name="material-symbols:keyboard-arrow-up" /></button>
                      <button class="ghost-button compact-button" :disabled="index === selectedCreatorLesson.exercises.length - 1" :aria-label="t('moveExerciseDown')" @click.stop="moveCreatorExercise(exercise.id, 1)"><Icon name="material-symbols:keyboard-arrow-down" /></button>
                    </span>
                  </span>
                  <span class="status-pill exercise-type-tag">{{ exerciseTypeLabel(exercise.type) }}</span>
                  <small>{{ exercise.prompt }}</small>
                </article>
              </aside>

              <article v-if="selectedCreatorExercise" class="exercise-editor">
                <div class="action-row" style="justify-content: space-between;">
                  <div>
                    <strong>{{ exerciseTypeLabel(selectedCreatorExercise.type) }}</strong>
                    <p class="eyebrow" style="margin: 0.25rem 0 0;">{{ t('selectedExercise') }}</p>
                  </div>
                  <button class="ghost-button danger-button" @click="removeCreatorExercise(selectedCreatorExercise.id)"><Icon name="material-symbols:delete" /> {{ t('remove') }}</button>
                </div>
                <div class="field-grid">
                  <label><span class="eyebrow">{{ t('exerciseType') }}</span><Select v-model="selectedCreatorExercise.type" :options="exerciseTypeOptions" option-label="label" option-value="value" /></label>
                  <label><span class="eyebrow">{{ t('promptQuestion') }}</span><input v-model="selectedCreatorExercise.prompt" class="input" /></label>
                </div>
                <label><span class="eyebrow">{{ selectedCreatorExercise.type === 'learn' ? t('wordPhrase') : t('sentence') }}</span><input v-model="selectedCreatorExercise.sentence" class="input cjk" /></label>
                <div v-if="selectedCreatorExercise.type === 'learn'" class="field-grid">
                  <label><span class="eyebrow">{{ t('illustration') }}</span><input v-model="selectedCreatorExercise.illustration" class="input" :placeholder="t('illustrationPlaceholder')" /></label>
                  <label><span class="eyebrow">{{ t('meaning') }}</span><input v-model="selectedCreatorExercise.translation" class="input" /></label>
                </div>
                <div class="field-grid">
                  <label><span class="eyebrow">{{ t('alternativeReading') }}</span><input v-model="selectedCreatorExercise.reading" class="input cjk" :placeholder="t('readingPlaceholder')" /></label>
                  <label v-if="selectedCreatorExercise.type !== 'learn'"><span class="eyebrow">{{ t('translation') }}</span><input v-model="selectedCreatorExercise.translation" class="input" /></label>
                </div>
                <div v-if="selectedCreatorExercise.type === 'fill-blank'" class="field-grid">
                  <label><span class="eyebrow">{{ t('blankBefore') }}</span><input v-model="selectedCreatorExercise.blankBefore" class="input cjk" /></label>
                  <label><span class="eyebrow">{{ t('blankAfter') }}</span><input v-model="selectedCreatorExercise.blankAfter" class="input cjk" /></label>
                </div>
                <div v-if="selectedCreatorExercise.type === 'sentence-order'" class="type-specific-editor">
                  <div class="field-grid">
                    <label><span class="eyebrow">{{ t('availableChunks') }}</span><input :value="selectedCreatorExercise.chips.join(' | ')" class="input cjk" placeholder="いち | に | さん" @input="setExerciseChipsFromInput(selectedCreatorExercise, ($event.target as HTMLInputElement).value)" /></label>
                    <label><span class="eyebrow">{{ t('correctOrder') }}</span><input :value="selectedCreatorExercise.orderItems.join(' | ')" class="input cjk" :placeholder="t('chunksPlaceholder')" @input="setOrderItemsFromInput(selectedCreatorExercise, ($event.target as HTMLInputElement).value)" /></label>
                  </div>
                  <p class="muted compact-help">{{ t('orderHelp') }}</p>
                </div>
                <div v-if="selectedCreatorExercise.type !== 'learn' && selectedCreatorExercise.type !== 'sentence-order'" class="field-grid">
                  <label><span class="eyebrow">{{ t('hint') }}</span><input v-model="selectedCreatorExercise.hint" class="input" /></label>
                </div>
                <label v-if="selectedCreatorExercise.type === 'sentence-order'"><span class="eyebrow">{{ t('hint') }}</span><input v-model="selectedCreatorExercise.hint" class="input" /></label>
                <div class="field-grid">
                  <label><span class="eyebrow">{{ t('grammarTitle') }}</span><input v-model="selectedCreatorExercise.grammarTitle" class="input" /></label>
                  <label><span class="eyebrow">{{ t('grammarNote') }}</span><input v-model="selectedCreatorExercise.grammarNote" class="input" /></label>
                </div>
                <label><span class="eyebrow">{{ t('exampleSentence') }}</span><input v-model="selectedCreatorExercise.example" class="input cjk" /></label>
                <div class="field-grid">
                  <label><span class="eyebrow">{{ t('exampleReading') }}</span><input v-model="selectedCreatorExercise.exampleReading" class="input cjk" /></label>
                  <label><span class="eyebrow">{{ t('exampleTranslation') }}</span><input v-model="selectedCreatorExercise.exampleTranslation" class="input" /></label>
                </div>
                <div v-if="selectedCreatorExercise.type !== 'learn' && selectedCreatorExercise.type !== 'sentence-order'" class="dialogue-answer-editor-list">
                  <p class="eyebrow">{{ t('answerOptions') }}</p>
                  <article class="dialogue-answer-editor">
                    <label><span class="eyebrow">{{ t('answerOptions') }}</span><input :value="exerciseAnswerOptions(selectedCreatorExercise).join(' | ')" class="input cjk" :placeholder="t('chunksPlaceholder')" @input="setExerciseAnswerOptions(selectedCreatorExercise, ($event.target as HTMLInputElement).value)" /></label>
                    <div class="dialogue-correct-options">
                      <span class="eyebrow">{{ t('correctAnswer') }}</span>
                      <label v-for="option in exerciseAnswerOptions(selectedCreatorExercise)" :key="option" class="dialogue-correct-option cjk">
                        <input type="radio" :name="`${selectedCreatorExercise.id}-correct`" :checked="selectedCreatorExercise.answer === option" @change="setExerciseCorrectAnswer(selectedCreatorExercise, option)" />
                        <span>{{ option }}</span>
                      </label>
                    </div>
                    <button class="secondary-button compact-button" @click="addExerciseAnswerOption(selectedCreatorExercise)"><Icon name="material-symbols:add" /> {{ t('option') }}</button>
                  </article>
                </div>
              </article>
            </div>
          </article>

          <article v-if="selectedCreatorLesson" class="card card-accent" style="--accent: var(--zs-secondary);">
            <div class="action-row" style="justify-content: space-between;">
              <h2><Icon name="material-symbols:forum" style="color: var(--zs-secondary);" /> {{ t('dialogues') }}</h2>
              <button class="secondary-button" @click="addCreatorDialogue"><Icon name="material-symbols:add" /> {{ t('addDialogue') }}</button>
            </div>
            <div class="exercise-workspace">
              <aside class="exercise-sidebar" :aria-label="t('dialogues')">
                <article v-for="(dialogue, index) in selectedCreatorLesson.dialogues" :key="dialogue.id" class="exercise-list-item" :class="{ active: dialogue.id === selectedCreatorDialogue?.id }" role="button" tabindex="0" @click="selectCreatorDialogue(dialogue.id)" @keydown.enter.prevent="selectCreatorDialogue(dialogue.id)" @keydown.space.prevent="selectCreatorDialogue(dialogue.id)">
                  <span class="exercise-list-heading">
                    <span class="exercise-list-title">{{ t('dialogueLabel') }} {{ index + 1 }}</span>
                    <span class="exercise-reorder-controls">
                      <button class="ghost-button compact-button" :disabled="index === 0" :aria-label="t('moveDialogueUp')" @click.stop="moveCreatorDialogue(dialogue.id, -1)"><Icon name="material-symbols:keyboard-arrow-up" /></button>
                      <button class="ghost-button compact-button" :disabled="index === selectedCreatorLesson.dialogues.length - 1" :aria-label="t('moveDialogueDown')" @click.stop="moveCreatorDialogue(dialogue.id, 1)"><Icon name="material-symbols:keyboard-arrow-down" /></button>
                    </span>
                  </span>
                  <span class="status-pill exercise-type-tag">{{ dialogue.lines.length }} {{ t('dialogueTurns') }}</span>
                  <small>{{ dialogue.title }}</small>
                </article>
                <div v-if="!selectedCreatorLesson.dialogues.length" class="validation-card compact-validation-card">
                  <strong>{{ t('noDialoguesYet') }}</strong>
                  <span class="muted">{{ t('addDialogueToLesson') }}</span>
                </div>
              </aside>

              <article v-if="selectedCreatorDialogue" class="exercise-editor">
                <div class="action-row" style="justify-content: space-between;">
                  <div>
                    <strong>{{ selectedCreatorDialogue.title }}</strong>
                    <p class="eyebrow" style="margin: 0.25rem 0 0;">{{ t('selectedDialogue') }}</p>
                  </div>
                  <button class="ghost-button danger-button" @click="removeCreatorDialogue(selectedCreatorDialogue.id)"><Icon name="material-symbols:delete" /> {{ t('remove') }}</button>
                </div>
                <div class="field-grid">
                  <label><span class="eyebrow">{{ t('dialogueTitle') }}</span><input v-model="selectedCreatorDialogue.title" class="input" /></label>
                  <label><span class="eyebrow">{{ t('dialogueScene') }}</span><input v-model="selectedCreatorDialogue.context" class="input" /></label>
                </div>
                <div class="field-grid">
                  <label><span class="eyebrow">{{ t('speakerA') }}</span><input v-model="selectedCreatorDialogue.speakerA" class="input" /></label>
                  <label><span class="eyebrow">{{ t('speakerB') }}</span><input v-model="selectedCreatorDialogue.speakerB" class="input" /></label>
                  <label><span class="eyebrow">{{ t('learnerRole') }}</span><input v-model="selectedCreatorDialogue.learnerRole" class="input" /></label>
                </div>
                <label><span class="eyebrow">{{ t('dialogueLines') }}</span><textarea :value="dialogueLinesToText(selectedCreatorDialogue.lines)" class="textarea cjk" @input="setDialogueLinesFromInput(selectedCreatorDialogue, ($event.target as HTMLTextAreaElement).value)" /></label>
                <div class="action-row dialogue-line-actions">
                  <button class="secondary-button" @click="addDialogueExchange(selectedCreatorDialogue)"><Icon name="material-symbols:add" /> {{ t('add') }} {{ selectedCreatorDialogue.speakerA === selectedCreatorDialogue.learnerRole ? selectedCreatorDialogue.speakerB : selectedCreatorDialogue.speakerA }} → {{ selectedCreatorDialogue.learnerRole }}</button>
                </div>
                <p class="muted compact-help">{{ t('dialogueLinesHelp') }}</p>
                <div v-if="selectedCreatorDialogue.lines.some(line => line.speaker === selectedCreatorDialogue.learnerRole)" class="dialogue-answer-editor-list">
                  <p class="eyebrow">{{ t('answerOptions') }}</p>
                  <article v-for="line in selectedCreatorDialogue.lines.filter(item => item.speaker === selectedCreatorDialogue.learnerRole)" :key="`${selectedCreatorDialogue.id}-${line.speaker}-${line.text}`" class="dialogue-answer-editor">
                    <strong class="cjk">{{ line.text }}</strong>
                    <label><span class="eyebrow">{{ t('answerOptions') }}</span><input :value="dialogueLineOptions(line).join(' | ')" class="input cjk" :placeholder="t('chunksPlaceholder')" @input="setDialogueLineOptions(line, ($event.target as HTMLInputElement).value)" /></label>
                    <div class="dialogue-correct-options">
                      <span class="eyebrow">{{ t('correctAnswer') }}</span>
                      <label v-for="option in dialogueLineOptions(line)" :key="option" class="dialogue-correct-option cjk">
                        <input type="radio" :name="`${selectedCreatorDialogue.id}-${line.text}-correct`" :checked="(line.correctAnswer || line.text) === option" @change="setDialogueLineCorrectAnswer(line, option)" />
                        <span>{{ option }}</span>
                      </label>
                    </div>
                    <button class="secondary-button compact-button" @click="addDialogueLineOption(line)"><Icon name="material-symbols:add" /> {{ t('option') }}</button>
                  </article>
                </div>
              </article>
            </div>
          </article>
        </section>
        <aside class="creator-side section-stack">
          <h2><Icon name="material-symbols:fact-check" /> {{ t('validation') }}</h2>
          <div class="validation-list">
            <div v-if="!creatorIssues.length" class="validation-card success-card compact-validation-card">
              <strong><Icon name="material-symbols:check-circle" /> {{ t('readyToExport') }}</strong>
              <span class="muted">{{ t('noBlockingIssues') }}</span>
            </div>
            <div v-for="issue in creatorIssues" v-else :key="issue" class="validation-card warning compact-validation-card">
              <strong><Icon name="material-symbols:warning" /> {{ issue === t('nativeAudioMissing') ? t('audioMissing') : t('needsAttention') }}</strong>
              <span class="muted">{{ issue }}</span>
              <button v-if="issue === t('nativeAudioMissing')" class="ghost-button link-button compact-link" @click="attachAudio">{{ t('markAudioAttached') }}</button>
            </div>
          </div>
          <div class="card compact-card">
            <p class="eyebrow">{{ t('courseFieldCoverage') }}</p>
            <ul class="coverage-list">
              <li v-for="item in creatorSchemaCoverage" :key="item"><Icon name="material-symbols:check-circle" /> {{ item }}</li>
            </ul>
          </div>
          <div class="card compact-card">
            <p class="eyebrow">{{ t('courseStats') }}</p>
            <p>{{ t('totalLessons') }} <strong style="float: right;">{{ creatorLessons.length }}</strong></p>
            <p>{{ t('totalExercises') }} <strong style="float: right;">{{ creatorLessons.reduce((total, lesson) => total + lesson.exercises.length, 0) }}</strong></p>
            <p>{{ t('totalDialogues') }} <strong style="float: right;">{{ creatorLessons.reduce((total, lesson) => total + lesson.dialogues.length, 0) }}</strong></p>
            <p>{{ t('vocabCount') }} <strong style="float: right;">{{ creatorLessons.reduce((total, lesson) => total + lesson.words.length, 0) }}</strong></p>
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
      <button class="primary-button" @click="database.saveProfile(profile); showToast(t('settingsSaved'), 'success')"><Icon name="material-symbols:save" /> {{ t('saveSettings') }}</button>
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