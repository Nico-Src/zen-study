<script setup lang="ts">
import BackupPanel from '~/components/BackupPanel.vue'
import PageHead from '~/components/PageHead.vue'
import ToastMessage from '~/components/ToastMessage.vue'
import { seedSettings, type CharacterEntry, type DialogueEntry, type DialogueLine, type StudySettings, type VocabularyEntry } from '~/data/seeds'

type ViewName = 'dashboard' | 'vocabulary' | 'flashcards' | 'characters' | 'dialogue' | 'admin' | 'backup'
type Rating = 'hard' | 'good' | 'easy'

const database = useStudyDatabase()
const { currentLanguage, languageOptions, setLanguage, t, initLanguage } = useUiLanguage()

const views: { key: ViewName, label: Parameters<typeof t>[0], icon: string }[] = [
  { key: 'dashboard', label: 'navDashboard', icon: 'material-symbols:dashboard' },
  { key: 'vocabulary', label: 'navVocabulary', icon: 'material-symbols:menu-book' },
  { key: 'flashcards', label: 'navFlashcards', icon: 'material-symbols:style' },
  { key: 'characters', label: 'navCharacters', icon: 'material-symbols:draw' },
  { key: 'dialogue', label: 'navDialogue', icon: 'material-symbols:forum' },
  { key: 'admin', label: 'navAdmin', icon: 'material-symbols:admin-panel-settings' }
]

const levelOptions = ['N5', 'N4', 'N3', 'N2', 'N1', 'A1', 'A2', 'B1', 'B2']
const adminTabs: { key: string, label: Parameters<typeof t>[0] }[] = [
  { key: 'vocabulary', label: 'tabVocabulary' },
  { key: 'characters', label: 'tabCharacters' },
  { key: 'dialogues', label: 'tabDialogues' },
  { key: 'backup', label: 'tabBackup' }
]

const currentView = ref<ViewName>('dashboard')
const adminTab = ref('vocabulary')
const navigationOpen = ref(false)
const search = ref('')
const loading = ref(true)
const databaseError = ref('')
const toastMessage = ref('')
const toastTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const vocabulary = ref<VocabularyEntry[]>([])
const characters = ref<CharacterEntry[]>([])
const dialogues = ref<DialogueEntry[]>([])
const reviews = ref<Record<string, unknown>[]>([])
const settings = ref<StudySettings>({ ...seedSettings })

const entryDialogVisible = ref(false)
const editingEntryId = ref<number | null>(null)
const vocabularyContextMenu = ref()
const selectedVocabularyRow = ref<VocabularyEntry | null>(null)
const entryForm = reactive({
  word: '',
  reading: '',
  romaji: '',
  meaning: '',
  hint: '',
  category: '',
  tags: '',
  level: 'N5',
  exampleJa: '',
  exampleEn: ''
})

const characterForm = reactive({ char: '', reading: '', meaning: '', level: 'N5', strokes: 1, hint: '' })
const dialogueForm = reactive({
  title: '',
  level: 'A1',
  setting: '',
  goal: '',
  lines: '[{"speaker":"learner","ja":"すみません","romaji":"sumimasen","en":"Excuse me"}]'
})

const flashIndex = ref(0)
const flashSessionStarted = ref(false)
const flashSessionSize = ref(10)
const flashSessionCards = ref<VocabularyEntry[]>([])
const flashSessionId = ref('')
const selectedFlashTags = ref<string[]>([])
const manualVocabularySelection = ref(false)
const selectedFlashVocabularyIds = ref<number[]>([])
const flashTagDialogVisible = ref(false)
const flashVocabularyDialogVisible = ref(false)
const flashAnswer = ref('')
const flashFeedback = ref<'correct' | 'incorrect' | ''>('')
const flashCorrectCount = ref(0)
const flashSessionComplete = ref(false)
const characterIndex = ref(0)
const characterCanvas = ref<HTMLCanvasElement | null>(null)
const characterHintVisible = ref(true)
const characterDrawing = ref(false)
const characterDrawScore = ref<number | null>(null)
const characterDrawFeedback = ref<'correct' | 'incorrect' | ''>('')
const characterHasDrawing = ref(false)
const dialogueIndex = ref(0)
const dialogueStep = ref(0)
const selectedDialogueAnswer = ref('')
const dialogueFeedback = ref<'correct' | 'incorrect' | ''>('')
const dialogueTranslationVisible = ref(false)
const dialogueKanaVisible = ref(false)
const revealed = ref(false)

const filteredVocabulary = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return vocabulary.value
  return vocabulary.value.filter(item => [
    item.word,
    item.reading,
    item.romaji,
    item.meaning,
    item.category,
    ...(item.tags || [])
  ].join(' ').toLowerCase().includes(query))
})

const dueVocabulary = computed(() => [...filteredVocabulary.value].sort((left, right) => (left.due || 0) - (right.due || 0)))
// Flashcard setup filters tags first, then optionally narrows that pool to hand-picked words.
const vocabularyTags = computed(() => Array.from(new Set(vocabulary.value.flatMap(item => item.tags || []))).sort((left, right) => left.localeCompare(right)))
const flashTagFilteredVocabulary = computed(() => {
  if (!selectedFlashTags.value.length) return dueVocabulary.value
  return dueVocabulary.value.filter(item => item.tags?.some(tag => selectedFlashTags.value.includes(tag)))
})
const selectedFlashVocabulary = computed(() => flashTagFilteredVocabulary.value.filter(item => item.id && selectedFlashVocabularyIds.value.includes(item.id)))
// Before manual selection, the selected tag pool is intentionally treated as fully selected.
const flashPracticeVocabulary = computed(() => manualVocabularySelection.value ? selectedFlashVocabulary.value : flashTagFilteredVocabulary.value)
const dueCharacters = computed(() => [...characters.value].sort((left, right) => (left.due || 0) - (right.due || 0)))
const activeFlashcard = computed(() => flashSessionCards.value[flashIndex.value])
const activeCharacter = computed(() => dueCharacters.value[characterIndex.value % Math.max(dueCharacters.value.length, 1)])
const activeDialogue = computed(() => dialogues.value[dialogueIndex.value % Math.max(dialogues.value.length, 1)])
const dialoguePrompts = computed(() => {
  const dialogue = activeDialogue.value
  if (!dialogue) return []
  return dialogue.lines
    .map((line, index) => ({ prompt: line, answer: dialogue.lines[index + 1], index }))
    .filter(turn => turn.answer && turn.answer.speaker === 'learner') as { prompt: DialogueLine, answer: DialogueLine, index: number }[]
})
const activeDialoguePrompt = computed(() => dialoguePrompts.value[dialogueStep.value % Math.max(dialoguePrompts.value.length, 1)])
const dialogueAnswerOptions = computed(() => {
  const turn = activeDialoguePrompt.value
  if (!turn) return []
  const learnerLines = activeDialogue.value?.lines.filter(line => line.speaker === 'learner').map(line => line.ja) || []
  const fallback = ['少し考えさせてください。', 'もう一度お願いします。', '大丈夫です、ありがとうございます。']
  const unique = Array.from(new Set([turn.answer.ja, ...learnerLines, ...fallback])).slice(0, 4)
  return unique.sort((left, right) => (left + dialogueStep.value).localeCompare(right + dialogueStep.value, 'ja'))
})
const visibleDialogueLines = computed(() => {
  const dialogue = activeDialogue.value
  const turn = activeDialoguePrompt.value
  if (!dialogue || !turn) return []
  const answerIndex = turn.index + 1
  const lastVisibleIndex = dialogueFeedback.value ? answerIndex : turn.index
  return dialogue.lines
    .map((line, index) => ({ line, index }))
    .filter(item => item.index <= lastVisibleIndex)
})

const dailyProgress = computed(() => Math.min(100, Math.round(((settings.value.reviewedToday || 0) / (settings.value.dailyGoal || 20)) * 100)))
const masteredWords = computed(() => vocabulary.value.filter(item => (item.mastery || 0) >= 80).length)
const recentVocabulary = computed(() => [...vocabulary.value].sort((left, right) => (right.id || 0) - (left.id || 0)).slice(0, 4))
const practiceSessionDates = computed(() => new Set(reviews.value
  .filter(item => item.kind === 'vocabulary-session' && typeof item.completedAt === 'string')
  .map(item => dateKey(String(item.completedAt)))
  .filter(Boolean)
))
const currentStreak = computed(() => {
  if (!practiceSessionDates.value.size) return 0
  const today = dateKey(new Date())
  let cursor = practiceSessionDates.value.has(today) ? today : shiftDateKey(today, -1)
  if (!practiceSessionDates.value.has(cursor)) return 0

  let streak = 0
  while (practiceSessionDates.value.has(cursor)) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }
  return streak
})
const vocabularySessionHistory = computed(() => reviews.value
  .filter(item => item.kind === 'vocabulary-session')
  .sort((left, right) => String(right.completedAt || '').localeCompare(String(left.completedAt || '')))
  .slice(0, 8)
)
const flashProgress = computed(() => {
  if (!flashSessionStarted.value || flashSessionCards.value.length === 0) return 0
  const completedCards = flashSessionComplete.value ? flashSessionCards.value.length : flashIndex.value
  return Math.round((completedCards / flashSessionCards.value.length) * 100)
})
const backupPanelCopy = computed(() => ({
  eyebrow: t('sqliteBackup'),
  title: t('moveProgress'),
  body: t('backupPanelCopy'),
  exportLabel: t('exportSqlite'),
  importLabel: t('importBackup'),
  resetLabel: t('resetSeeds')
}))
const vocabularyContextMenuItems = computed(() => [
  {
    label: t('editWord'),
    icon: 'pi pi-pencil',
    command: () => {
      if (selectedVocabularyRow.value) openEntryDialog(selectedVocabularyRow.value)
    }
  },
  {
    label: t('delete'),
    icon: 'pi pi-trash',
    command: () => {
      if (selectedVocabularyRow.value) deleteVocabularyEntry(selectedVocabularyRow.value)
    }
  }
])

watch(flashPracticeVocabulary, (cards) => {
  const maxCards = Math.max(cards.length, 1)
  flashSessionSize.value = Math.max(1, Math.min(Number(flashSessionSize.value || 1), maxCards))
})

watch(flashTagFilteredVocabulary, (cards) => {
  const availableIds = new Set(cards.map(item => item.id).filter((id): id is number => typeof id === 'number'))
  selectedFlashVocabularyIds.value = selectedFlashVocabularyIds.value.filter(id => availableIds.has(id))
})

watch(activeCharacter, async () => {
  characterDrawFeedback.value = ''
  characterDrawScore.value = null
  characterHasDrawing.value = false
  await nextTick()
  clearCharacterCanvas()
})

async function refreshData() {
  const [vocabularyRows, characterRows, dialogueRows, reviewRows, settingsRows] = await Promise.all([
    database.getAll('vocabulary'),
    database.getAll('characters'),
    database.getAll('dialogues'),
    database.getAll('reviews'),
    database.getAll('settings')
  ])

  vocabulary.value = vocabularyRows
  characters.value = characterRows
  dialogues.value = dialogueRows
  reviews.value = reviewRows
  settings.value = settingsRows.find(item => item.key === 'profile') || { ...seedSettings }
}

function showToast(message: string) {
  toastMessage.value = message
  if (toastTimer.value) clearTimeout(toastTimer.value)
  toastTimer.value = setTimeout(() => {
    toastMessage.value = ''
  }, 2800)
}

function switchView(view: ViewName) {
  currentView.value = view
  revealed.value = false
  dialogueFeedback.value = ''
  selectedDialogueAnswer.value = ''
  dialogueTranslationVisible.value = false
  dialogueKanaVisible.value = false
  navigationOpen.value = false
  if (import.meta.client) window.location.hash = view
}

function normalizeMeaning(value: string) {
  return value.trim().toLowerCase().replace(/[.!?。！？]+$/g, '').replace(/\s+/g, ' ')
}

function dateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function shiftDateKey(value: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return ''
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return dateKey(new Date(year, month - 1, day + days))
}

function meaningAnswers(card: VocabularyEntry) {
  return card.meaning
    .split(/[;,/]|\bor\b/i)
    .map(answer => normalizeMeaning(answer))
    .filter(Boolean)
}

function toggleFlashTag(tag: string) {
  selectedFlashTags.value = selectedFlashTags.value.includes(tag)
    ? selectedFlashTags.value.filter(item => item !== tag)
    : [...selectedFlashTags.value, tag]
  manualVocabularySelection.value = false
  selectedFlashVocabularyIds.value = []
}

function selectAllFlashTags() {
  selectedFlashTags.value = [...vocabularyTags.value]
  manualVocabularySelection.value = false
  selectedFlashVocabularyIds.value = []
}

function deselectAllFlashTags() {
  selectedFlashTags.value = []
  manualVocabularySelection.value = false
  selectedFlashVocabularyIds.value = []
}

// Manual vocab selection intentionally starts empty after the user chooses to curate the tag pool.
function beginVocabularySelection() {
  if (!manualVocabularySelection.value) selectedFlashVocabularyIds.value = []
  manualVocabularySelection.value = true
  flashVocabularyDialogVisible.value = true
}

function toggleFlashVocabulary(entry: VocabularyEntry) {
  if (!entry.id) return
  selectedFlashVocabularyIds.value = selectedFlashVocabularyIds.value.includes(entry.id)
    ? selectedFlashVocabularyIds.value.filter(id => id !== entry.id)
    : [...selectedFlashVocabularyIds.value, entry.id]
}

function selectAllFlashVocabulary() {
  selectedFlashVocabularyIds.value = flashTagFilteredVocabulary.value
    .map(item => item.id)
    .filter((id): id is number => typeof id === 'number')
}

function deselectAllFlashVocabulary() {
  selectedFlashVocabularyIds.value = []
}

function startFlashSession() {
  const size = Math.max(1, Math.min(Number(flashSessionSize.value || 1), flashPracticeVocabulary.value.length))
  flashSessionCards.value = flashPracticeVocabulary.value.slice(0, size)
  flashSessionId.value = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  flashIndex.value = 0
  flashAnswer.value = ''
  flashFeedback.value = ''
  flashCorrectCount.value = 0
  flashSessionComplete.value = false
  flashSessionStarted.value = true
  revealed.value = false
}

function resetFlashSession() {
  flashSessionStarted.value = false
  flashSessionCards.value = []
  flashSessionId.value = ''
  flashAnswer.value = ''
  flashFeedback.value = ''
  flashCorrectCount.value = 0
  flashSessionComplete.value = false
  flashIndex.value = 0
  revealed.value = false
}

async function checkFlashAnswer() {
  const card = activeFlashcard.value
  if (!card || flashFeedback.value) return
  const normalizedAnswer = normalizeMeaning(flashAnswer.value)
  if (!normalizedAnswer) return

  const correct = meaningAnswers(card).some(answer => normalizedAnswer === answer)
  const rating: Rating = correct ? 'easy' : 'hard'
  const intervals = { hard: 60 * 1000, good: 24 * 60 * 60 * 1000, easy: 4 * 24 * 60 * 60 * 1000 }
  const deltas = { hard: -8, good: 10, easy: 18 }

  flashFeedback.value = correct ? 'correct' : 'incorrect'
  revealed.value = true
  if (correct) flashCorrectCount.value += 1

  await database.put('vocabulary', {
    ...card,
    mastery: Math.max(0, Math.min(100, (card.mastery || 0) + deltas[rating])),
    due: Date.now() + intervals[rating]
  })
  await database.put('reviews', {
    kind: 'vocabulary-answer',
    sessionId: flashSessionId.value,
    itemId: card.id,
    word: card.word,
    expected: card.meaning,
    answer: flashAnswer.value,
    correct,
    rating,
    reviewedAt: new Date().toISOString()
  })
  await updateStudyStats()
  await refreshData()
}

async function finishFlashSession() {
  flashSessionComplete.value = true
  await database.put('reviews', {
    kind: 'vocabulary-session',
    sessionId: flashSessionId.value,
    total: flashSessionCards.value.length,
    correct: flashCorrectCount.value,
    score: flashSessionCards.value.length ? Math.round((flashCorrectCount.value / flashSessionCards.value.length) * 100) : 0,
    completedAt: new Date().toISOString()
  })
  await refreshData()
}

async function nextFlashcard() {
  if (!flashFeedback.value) return
  if (flashIndex.value + 1 >= flashSessionCards.value.length) {
    await finishFlashSession()
    return
  }
  flashIndex.value += 1
  flashAnswer.value = ''
  flashFeedback.value = ''
  revealed.value = false
}

function selectDialogue(index: number) {
  dialogueIndex.value = index
  dialogueStep.value = 0
  selectedDialogueAnswer.value = ''
  dialogueFeedback.value = ''
  dialogueTranslationVisible.value = false
  dialogueKanaVisible.value = false
}

function checkDialogueAnswer(answer: string) {
  const turn = activeDialoguePrompt.value
  if (!turn) return
  selectedDialogueAnswer.value = answer
  dialogueFeedback.value = answer === turn.answer.ja ? 'correct' : 'incorrect'
}

function nextDialoguePrompt() {
  dialogueStep.value += 1
  selectedDialogueAnswer.value = ''
  dialogueFeedback.value = ''
  dialogueTranslationVisible.value = false
  dialogueKanaVisible.value = false
}

function lineKana(line: DialogueLine) {
  const kanaByLine: Record<string, string> = {
    'いらっしゃいませ！何名様ですか？': 'いらっしゃいませ！なんめいさまですか？',
    '一人です。カウンター席でもいいですか？': 'ひとりです。カウンターせきでもいいですか？',
    'はい、どうぞ。ご注文はお決まりですか？': 'はい、どうぞ。ごちゅうもんはおきまりですか？',
    '味噌ラーメンを一つお願いします。': 'みそラーメンをひとつおねがいします。',
    'すみません、駅はどこですか？': 'すみません、えきはどこですか？',
    'この道をまっすぐ行って、右です。': 'このみちをまっすぐいって、みぎです。',
    'ありがとうございます。': 'ありがとうございます。'
  }
  return line.kana || kanaByLine[line.ja] || ''
}

function openEntryDialog(entry?: VocabularyEntry) {
  editingEntryId.value = entry?.id || null
  Object.assign(entryForm, {
    word: entry?.word || '',
    reading: entry?.reading || '',
    romaji: entry?.romaji || '',
    meaning: entry?.meaning || '',
    hint: entry?.hint || '',
    category: entry?.category || '',
    tags: entry?.tags?.join(', ') || '',
    level: entry?.level || 'N5',
    exampleJa: entry?.exampleJa || '',
    exampleEn: entry?.exampleEn || ''
  })
  entryDialogVisible.value = true
}

async function saveVocabularyEntry() {
  const existing = editingEntryId.value ? vocabulary.value.find(item => item.id === editingEntryId.value) : null
  const payload: VocabularyEntry = {
    ...existing,
    word: entryForm.word,
    reading: entryForm.reading,
    romaji: entryForm.romaji,
    meaning: entryForm.meaning,
    hint: entryForm.hint,
    category: entryForm.category || 'General',
    tags: entryForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    level: entryForm.level,
    exampleJa: entryForm.exampleJa,
    exampleEn: entryForm.exampleEn,
    mastery: existing?.mastery || 0,
    due: existing?.due || Date.now(),
    createdAt: existing?.createdAt || new Date().toISOString()
  }
  if (editingEntryId.value) payload.id = editingEntryId.value
  await database.put('vocabulary', payload)
  entryDialogVisible.value = false
  await refreshData()
  showToast(t('toastVocabularySaved'))
}

async function deleteVocabularyEntry(entry: VocabularyEntry) {
  if (!entry.id || !confirm(t('confirmDeleteWord', { word: entry.word }))) return
  await database.remove('vocabulary', entry.id)
  await refreshData()
  showToast(t('toastVocabularyDeleted'))
}

function openVocabularyContextMenu(event: { originalEvent: Event, data: VocabularyEntry }) {
  selectedVocabularyRow.value = event.data
  vocabularyContextMenu.value?.show(event.originalEvent)
}

async function saveCharacter() {
  await database.put('characters', {
    char: characterForm.char,
    reading: characterForm.reading,
    meaning: characterForm.meaning,
    level: characterForm.level,
    strokes: Number(characterForm.strokes || 1),
    hint: characterForm.hint,
    mastery: 0,
    due: Date.now(),
    createdAt: new Date().toISOString()
  })
  Object.assign(characterForm, { char: '', reading: '', meaning: '', level: 'N5', strokes: 1, hint: '' })
  await refreshData()
  showToast(t('toastCharacterAdded'))
}

async function deleteCharacter(entry: CharacterEntry) {
  if (!entry.id || !confirm(t('confirmDeleteCharacter', { char: entry.char }))) return
  await database.remove('characters', entry.id)
  await refreshData()
  showToast(t('toastCharacterDeleted'))
}

async function saveDialogue() {
  let parsedLines: DialogueLine[]
  try {
    parsedLines = JSON.parse(dialogueForm.lines)
  } catch {
    showToast(t('toastDialogueJson'))
    return
  }

  await database.put('dialogues', {
    title: dialogueForm.title,
    level: dialogueForm.level,
    setting: dialogueForm.setting,
    goal: dialogueForm.goal,
    lines: parsedLines,
    createdAt: new Date().toISOString()
  })
  Object.assign(dialogueForm, { title: '', level: 'A1', setting: '', goal: '', lines: '[{"speaker":"learner","ja":"すみません","romaji":"sumimasen","en":"Excuse me"}]' })
  await refreshData()
  showToast(t('toastDialogueAdded'))
}

async function deleteDialogue(entry: DialogueEntry) {
  if (!entry.id || !confirm(t('confirmDeleteDialogue', { title: entry.title }))) return
  await database.remove('dialogues', entry.id)
  await refreshData()
  showToast(t('toastDialogueDeleted'))
}

async function updateStudyStats() {
  const today = new Date().toISOString().slice(0, 10)
  const nextSettings = { ...settings.value, key: 'profile' as const }
  if (nextSettings.lastStudyDate !== today) {
    nextSettings.reviewedToday = 0
  }
  nextSettings.reviewedToday += 1
  nextSettings.lastStudyDate = today
  await database.put('settings', nextSettings)
}

function characterContext() {
  const canvas = characterCanvas.value
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return null
  return { canvas, context }
}

function characterPointerPosition(event: PointerEvent) {
  const canvas = characterCanvas.value
  if (!canvas) return null
  const bounds = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height
  }
}

function clearCharacterCanvas() {
  const drawing = characterContext()
  if (!drawing) return
  drawing.context.clearRect(0, 0, drawing.canvas.width, drawing.canvas.height)
  characterDrawScore.value = null
  characterDrawFeedback.value = ''
  characterHasDrawing.value = false
}

function startCharacterStroke(event: PointerEvent) {
  const drawing = characterContext()
  const point = characterPointerPosition(event)
  if (!drawing || !point || characterDrawFeedback.value === 'correct') return
  event.preventDefault()
  drawing.canvas.setPointerCapture(event.pointerId)
  drawing.context.lineCap = 'round'
  drawing.context.lineJoin = 'round'
  drawing.context.lineWidth = 30
  drawing.context.strokeStyle = '#000666'
  drawing.context.beginPath()
  drawing.context.moveTo(point.x, point.y)
  characterDrawing.value = true
  characterHasDrawing.value = true
  characterDrawFeedback.value = ''
}

function drawCharacterStroke(event: PointerEvent) {
  if (!characterDrawing.value) return
  const drawing = characterContext()
  const point = characterPointerPosition(event)
  if (!drawing || !point) return
  event.preventDefault()
  drawing.context.lineTo(point.x, point.y)
  drawing.context.stroke()
}

function finishCharacterStroke(event: PointerEvent) {
  if (!characterDrawing.value) return
  characterDrawing.value = false
  characterCanvas.value?.releasePointerCapture(event.pointerId)
}

function referenceCharacterMask(character: string, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = '#000'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `420px "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif`
  context.fillText(character, size / 2, size / 2 + 8)
  return context.getImageData(0, 0, size, size).data
}

function hasNearbyPixel(data: Uint8ClampedArray, width: number, x: number, y: number, radius: number, step: number) {
  for (let offsetY = -radius; offsetY <= radius; offsetY += step) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += step) {
      if ((offsetX * offsetX) + (offsetY * offsetY) > radius * radius) continue
      const nextX = x + offsetX
      const nextY = y + offsetY
      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= width) continue
      if (data[((nextY * width + nextX) * 4) + 3] > 24) return true
    }
  }
  return false
}

function compareCharacterDrawing() {
  const drawing = characterContext()
  const character = activeCharacter.value
  if (!drawing || !character || !characterHasDrawing.value || !import.meta.client) return

  const size = drawing.canvas.width
  const drawnData = drawing.context.getImageData(0, 0, size, size).data
  const targetData = referenceCharacterMask(character.char, size)
  if (!targetData) return

  let targetPixels = 0
  let matchedTargetPixels = 0
  let drawnPixels = 0
  let matchedDrawnPixels = 0
  const sampleStep = 4
  const targetTolerance = 22
  const drawnTolerance = 28

  for (let y = 0; y < size; y += sampleStep) {
    for (let x = 0; x < size; x += sampleStep) {
      const alphaIndex = ((y * size + x) * 4) + 3
      if (targetData[alphaIndex] > 24) {
        targetPixels += 1
        if (hasNearbyPixel(drawnData, size, x, y, targetTolerance, sampleStep)) matchedTargetPixels += 1
      }
      if (drawnData[alphaIndex] > 24) {
        drawnPixels += 1
        if (hasNearbyPixel(targetData, size, x, y, drawnTolerance, sampleStep)) matchedDrawnPixels += 1
      }
    }
  }

  const coverage = targetPixels ? matchedTargetPixels / targetPixels : 0
  const precision = drawnPixels ? matchedDrawnPixels / drawnPixels : 0
  const score = Math.round(((coverage * 0.62) + (precision * 0.38)) * 100)
  characterDrawScore.value = score
  characterDrawFeedback.value = score >= 85 ? 'correct' : 'incorrect'
}

async function rateVocabulary(rating: Rating) {
  const card = activeFlashcard.value
  if (!card) return
  const intervals = { hard: 60 * 1000, good: 24 * 60 * 60 * 1000, easy: 4 * 24 * 60 * 60 * 1000 }
  const deltas = { hard: -8, good: 10, easy: 18 }
  await database.put('vocabulary', {
    ...card,
    mastery: Math.max(0, Math.min(100, (card.mastery || 0) + deltas[rating])),
    due: Date.now() + intervals[rating]
  })
  await database.put('reviews', { itemId: card.id, store: 'vocabulary', rating, reviewedAt: new Date().toISOString() })
  await updateStudyStats()
  flashIndex.value += 1
  revealed.value = false
  await refreshData()
}

async function rateCharacter(rating: Rating) {
  const card = activeCharacter.value
  if (!card) return
  const intervals = { hard: 60 * 1000, good: 24 * 60 * 60 * 1000, easy: 4 * 24 * 60 * 60 * 1000 }
  const deltas = { hard: -8, good: 10, easy: 18 }
  await database.put('characters', {
    ...card,
    mastery: Math.max(0, Math.min(100, (card.mastery || 0) + deltas[rating])),
    due: Date.now() + intervals[rating]
  })
  await database.put('reviews', { itemId: card.id, store: 'characters', rating, reviewedAt: new Date().toISOString() })
  await updateStudyStats()
  characterIndex.value += 1
  revealed.value = false
  await refreshData()
}

function speak(line: DialogueLine) {
  if (!import.meta.client || !('speechSynthesis' in window)) {
    showToast(t('toastSpeechUnavailable'))
    return
  }
  const utterance = new SpeechSynthesisUtterance(line.ja)
  utterance.lang = 'ja-JP'
  speechSynthesis.speak(utterance)
}

async function exportDatabase() {
  const data = await database.exportBackup()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `zenstudy-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  showToast(t('toastBackupDownloaded'))
}

async function importDatabase(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const data = JSON.parse(await file.text()) as Record<string, unknown>
  await database.importBackup(data)
  await refreshData()
  input.value = ''
  showToast(t('toastBackupImported'))
}

async function resetSeeds() {
  if (!confirm(t('confirmResetSeeds'))) return
  await database.resetToSeeds()
  await refreshData()
  showToast(t('toastSeedsRestored'))
}

onMounted(async () => {
  try {
    initLanguage()
    await refreshData()
    const hash = window.location.hash.replace('#', '') as ViewName
    if (views.some(view => view.key === hash) || hash === 'backup') currentView.value = hash
  } catch (error) {
    databaseError.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div :class="['app-shell', { 'nav-open': navigationOpen }]">
    <button v-if="navigationOpen" class="nav-backdrop" type="button" :aria-label="t('navOpen')" @click="navigationOpen = false"></button>
    <aside class="side-nav" :aria-label="t('navOpen')">
      <div class="side-nav-head">
        <button class="brand" type="button" @click="switchView('dashboard')">
          <span class="brand-mark">禅</span>
          <span>ZenStudy</span>
        </button>
        <Button class="nav-close" icon="pi pi-times" text rounded :aria-label="t('navOpen')" @click="navigationOpen = false" />
      </div>

      <nav class="nav-list">
        <button
          v-for="view in views"
          :key="view.key"
          :class="{ active: currentView === view.key }"
          type="button"
          @click="switchView(view.key)"
        >
          <Icon :name="view.icon" />
          <span>{{ t(view.label) }}</span>
        </button>
      </nav>

      <div class="nav-footer">
        <Select
          id="sideLanguageSelect"
          v-model="currentLanguage"
          class="language-select side-language-select"
          :aria-label="t('languageLabel')"
          :options="languageOptions"
          option-label="name"
          option-value="code"
          @update:model-value="setLanguage"
        >
          <template #value="slotProps">
            <span v-if="slotProps.value" class="language-value">
              <Icon class="language-flag" :name="languageOptions.find(option => option.code === slotProps.value)?.flagIcon || 'twemoji:flag-united-kingdom'" />
              {{ languageOptions.find(option => option.code === slotProps.value)?.name }}
            </span>
          </template>
          <template #option="slotProps">
            <span class="language-value">
              <Icon class="language-flag" :name="slotProps.option.flagIcon" />
              {{ slotProps.option.name }}
            </span>
          </template>
        </Select>
        <Button :label="t('navQuickAdd')" icon="pi pi-plus" severity="contrast" @click="navigationOpen = false; openEntryDialog()" />
        <Button :label="t('navBackup')" icon="pi pi-download" outlined @click="switchView('backup')" />
      </div>
    </aside>

    <main class="main-shell">
      <header class="top-bar">
        <Button class="mobile-menu" icon="pi pi-bars" text rounded :aria-label="t('navOpen')" @click="navigationOpen = !navigationOpen" />
        <span class="search-wrap">
          <Icon name="material-symbols:search" />
          <InputText v-model="search" :placeholder="t('searchPlaceholder')" :aria-label="t('searchLabel')" />
        </span>
        <div class="top-stats">
          <Select
            id="languageSelect"
            v-model="currentLanguage"
            class="language-select"
            :aria-label="t('languageLabel')"
            :options="languageOptions"
            option-label="name"
            option-value="code"
            @update:model-value="setLanguage"
          >
              <template #value="slotProps">
                <span v-if="slotProps.value" class="language-value">
                  <Icon class="language-flag" :name="languageOptions.find(option => option.code === slotProps.value)?.flagIcon || 'twemoji:flag-united-kingdom'" />
                  {{ languageOptions.find(option => option.code === slotProps.value)?.name }}
                </span>
              </template>
              <template #option="slotProps">
                <span class="language-value">
                  <Icon class="language-flag" :name="slotProps.option.flagIcon" />
                  {{ slotProps.option.name }}
                </span>
              </template>
          </Select>
          <span class="streak-pill"><Icon name="material-symbols:local-fire-department" /> <b>{{ currentStreak }}</b> {{ t('navDays') }}</span>
          <Button :label="t('navStart')" icon="pi pi-play" severity="contrast" @click="switchView('flashcards')" />
        </div>
      </header>

      <ToastMessage :message="toastMessage" />

      <section class="content-canvas">
        <div v-if="loading" class="page loading-page">
          <ProgressSpinner />
          <p>{{ t('loadingDatabase') }}</p>
        </div>

        <div v-else-if="databaseError" class="page loading-page">
          <section class="empty-state">
            <h2>{{ t('databaseOpenError') }}</h2>
            <p>{{ databaseError }}</p>
            <p>{{ t('databaseWriteError') }}</p>
          </section>
        </div>

        <div v-else-if="currentView === 'dashboard'" class="page dashboard-page">
          <PageHead :eyebrow="t('dashEyebrow')" :title="t('dashTitle')" :copy="t('dashCopy')" :action-label="t('dashBeginReview')" action-icon="pi pi-play" @action="switchView('flashcards')" />

          <section class="metric-grid">
            <article class="metric-card">
              <span>{{ t('metricVocabulary') }}</span>
              <strong>{{ vocabulary.length }}</strong>
              <p>{{ t('masteredWords', { count: masteredWords }) }}</p>
            </article>
            <article class="metric-card">
              <span>{{ t('metricDialogueSets') }}</span>
              <strong>{{ dialogues.length }}</strong>
              <p>{{ t('scenarioPractice') }}</p>
            </article>
            <article class="metric-card">
              <span>{{ t('metricDailyGoal') }}</span>
              <strong>{{ dailyProgress }}%</strong>
              <ProgressBar :value="dailyProgress" :show-value="false" />
            </article>
          </section>

          <section class="panel">
            <div class="section-head">
              <div>
                <p class="eyebrow">{{ t('recentlyAdded') }}</p>
                <h2>{{ t('libraryNotes') }}</h2>
              </div>
              <Button :label="t('viewLibrary')" text @click="switchView('vocabulary')" />
            </div>
            <div class="word-grid">
              <Card v-for="entry in recentVocabulary" :key="entry.id" class="word-card" @click="openEntryDialog(entry)">
                <template #content>
                  <div class="word-card-head">
                    <span class="jp word-token">{{ entry.word }}</span>
                    <Tag :value="entry.category" severity="secondary" />
                  </div>
                  <b>{{ entry.reading }}</b>
                  <p>{{ entry.meaning }}</p>
                </template>
              </Card>
            </div>
          </section>

          <section class="split-grid">
            <article class="panel">
              <p class="eyebrow">{{ t('adminEyebrow') }}</p>
              <h2>{{ t('manageCorpus') }}</h2>
              <p>{{ t('manageCorpusCopy') }}</p>
              <Button :label="t('openAdmin')" icon="pi pi-cog" severity="contrast" @click="switchView('admin')" />
            </article>
            <article class="panel">
              <p class="eyebrow">{{ t('portableProgress') }}</p>
              <h2>{{ t('exportImportTitle') }}</h2>
              <p>{{ t('exportImportCopy') }}</p>
              <Button :label="t('backupTools')" icon="pi pi-download" severity="contrast" @click="switchView('backup')" />
            </article>
          </section>
        </div>

        <div v-else-if="currentView === 'vocabulary'" class="page">
          <PageHead :eyebrow="t('vocabEyebrow')" :title="t('vocabTitle')" :copy="t('vocabCopy')" :action-label="t('addWord')" action-icon="pi pi-plus" @action="openEntryDialog()" />
          <div v-if="filteredVocabulary.length" class="word-grid">
            <Card v-for="entry in filteredVocabulary" :key="entry.id" class="word-card" @click="openEntryDialog(entry)">
              <template #content>
                <div class="word-card-head">
                  <span class="jp word-token">{{ entry.word }}</span>
                  <Tag :value="entry.level" />
                </div>
                <b>{{ entry.reading }} · {{ entry.romaji }}</b>
                <p>{{ entry.meaning }}</p>
                <div class="chip-row">
                  <span class="chip">{{ entry.category }}</span>
                  <span v-for="tag in entry.tags" :key="tag" class="chip muted-chip">{{ tag }}</span>
                </div>
              </template>
            </Card>
          </div>
          <div v-else class="empty-state">{{ t('noVocabularyMatches') }}</div>
        </div>

        <div v-else-if="currentView === 'flashcards'" class="page study-page">
          <PageHead :eyebrow="t('flashEyebrow')" :title="t('flashTitle')" :copy="t('flashCopy')" />

          <section v-if="!flashSessionStarted" class="session-layout">
            <article class="panel session-setup-panel">
              <p class="eyebrow">{{ t('newSession') }}</p>
              <h2>{{ t('howManyCards') }}</h2>
              <p>{{ t('cardsAvailable', { count: flashPracticeVocabulary.length }) }}</p>
              <div v-if="vocabularyTags.length" class="flash-filter-stack">
                <div class="filter-head">
                  <b>{{ t('practiceFilters') }}</b>
                  <span>{{ selectedFlashTags.length ? t('tagPoolCount', { count: flashTagFilteredVocabulary.length }) : t('allTagsSelected') }}</span>
                </div>
                <div class="filter-actions">
                  <Button :label="t('selectTags')" icon="pi pi-tags" outlined @click="flashTagDialogVisible = true" />
                  <Button
                    v-if="selectedFlashTags.length"
                    :label="t('selectVocab')"
                    icon="pi pi-list-check"
                    outlined
                    :disabled="flashTagFilteredVocabulary.length === 0"
                    @click="beginVocabularySelection"
                  />
                </div>
                <p v-if="selectedFlashTags.length" class="filter-summary">
                  {{ selectedFlashTags.join(', ') }}
                  <span v-if="manualVocabularySelection">· {{ t('selectedVocabCount', { count: selectedFlashVocabularyIds.length }) }}</span>
                </p>
              </div>
              <FloatLabel class="session-size-field">
                <InputNumber id="sessionSize" v-model="flashSessionSize" :min="1" :max="Math.max(flashPracticeVocabulary.length, 1)" show-buttons />
                <label for="sessionSize">{{ t('cardsThisSession') }}</label>
              </FloatLabel>
              <Button :label="t('startFlashcards')" icon="pi pi-play" severity="contrast" :disabled="flashPracticeVocabulary.length === 0" @click="startFlashSession" />
            </article>

            <article class="panel session-history-panel">
              <p class="eyebrow">{{ t('practiceHistory') }}</p>
              <h2>{{ t('recentSessions') }}</h2>
              <div v-if="vocabularySessionHistory.length" class="history-list">
                <div v-for="session in vocabularySessionHistory" :key="String(session.sessionId)" class="history-row">
                  <b>{{ session.correct }} / {{ session.total }}</b>
                  <span>{{ session.score }}%</span>
                  <small>{{ new Date(String(session.completedAt)).toLocaleString() }}</small>
                </div>
              </div>
              <p v-else>{{ t('noPracticeSessions') }}</p>
            </article>
          </section>

          <template v-else>
            <div class="session-status-bar">
              <ProgressBar :value="flashProgress" :show-value="false" />
              <div>
                <b>{{ flashCorrectCount }}</b> {{ t('points') }}
                <span>{{ Math.min(flashIndex + 1, flashSessionCards.length) }} / {{ flashSessionCards.length }}</span>
              </div>
            </div>

            <section v-if="flashSessionComplete" class="panel session-complete-panel">
              <p class="eyebrow">{{ t('sessionComplete') }}</p>
              <h2>{{ t('correctCount', { correct: flashCorrectCount, total: flashSessionCards.length }) }}</h2>
              <p>{{ t('sessionScore', { score: flashSessionCards.length ? Math.round((flashCorrectCount / flashSessionCards.length) * 100) : 0 }) }}</p>
              <div class="feedback-actions">
                <Button :label="t('newSession')" icon="pi pi-refresh" severity="contrast" @click="resetFlashSession" />
                <Button :label="t('reviewVocabulary')" icon="pi pi-book" outlined @click="switchView('vocabulary')" />
              </div>
            </section>

            <template v-else>
              <article v-if="activeFlashcard" :class="['study-card', { revealed }]">
                <Tag :value="activeFlashcard.category || 'Vocabulary'" severity="secondary" />
                <p class="jp reading-token">{{ activeFlashcard.word }}</p>
                <h2 class="jp main-token">{{ activeFlashcard.reading }}</h2>
                <template v-if="revealed">
                  <Tag style="margin-top: 15px;" :severity="flashFeedback === 'correct' ? 'success' : 'danger'" :value="flashFeedback === 'correct' ? t('correct') : t('incorrect')" />
                  <h3>{{ activeFlashcard.meaning }}</h3>
                  <p>{{ activeFlashcard.romaji }}</p>
                  <blockquote>{{ activeFlashcard.hint || t('noPersonalHint') }}</blockquote>
                </template>
                <p v-else>{{ t('typeMeaningHint') }}</p>
              </article>

              <form v-if="activeFlashcard" class="answer-form" @submit.prevent="checkFlashAnswer">
                <FloatLabel>
                  <InputText id="meaningAnswer" v-model="flashAnswer" :disabled="Boolean(flashFeedback)" autocomplete="off" />
                  <label for="meaningAnswer">{{ t('meaning') }}</label>
                </FloatLabel>
                <Button v-if="!flashFeedback" :label="t('checkAnswer')" icon="pi pi-check" severity="contrast" type="submit" :disabled="!flashAnswer.trim()" />
                <Button v-else :label="flashIndex + 1 >= flashSessionCards.length ? t('finishSession') : t('nextCard')" icon="pi pi-arrow-right" severity="contrast" type="button" @click="nextFlashcard" />
              </form>

              <section v-if="activeFlashcard && revealed" class="panel context-panel">
                <p class="eyebrow">{{ t('context') }}</p>
                <p class="jp">{{ activeFlashcard.exampleJa }}</p>
                <p>{{ activeFlashcard.exampleEn }}</p>
              </section>
            </template>
          </template>

          <div v-if="!dueVocabulary.length && !flashSessionStarted" class="empty-state">{{ t('addVocabularyToBegin') }}</div>
        </div>

        <div v-else-if="currentView === 'characters'" class="page study-page">
          <PageHead :eyebrow="t('charEyebrow')" :title="t('charTitle')" :copy="t('charCopy')" />
          <section v-if="activeCharacter" class="character-practice-panel">
            <div class="character-practice-head">
              <div>
                <Tag :value="activeCharacter.level" />
                <h2>{{ t('traceCharacter') }}</h2>
                <p><span class="jp">{{ activeCharacter.char }}</span> · {{ activeCharacter.reading }} · {{ activeCharacter.meaning }}</p>
              </div>
              <strong v-if="characterDrawScore !== null" :class="['draw-score', characterDrawFeedback]">{{ characterDrawScore }}%</strong>
            </div>

            <div class="draw-board">
              <span v-if="characterHintVisible" class="jp character-guide">{{ activeCharacter.char }}</span>
              <canvas
                ref="characterCanvas"
                width="512"
                height="512"
                :aria-label="t('drawCharacterCanvas')"
                @pointerdown="startCharacterStroke"
                @pointermove="drawCharacterStroke"
                @pointerup="finishCharacterStroke"
                @pointercancel="finishCharacterStroke"
              ></canvas>
              <div class="draw-axis horizontal"></div>
              <div class="draw-axis vertical"></div>
            </div>

            <div v-if="characterDrawFeedback" :class="['draw-feedback', characterDrawFeedback]">
              <b>{{ characterDrawFeedback === 'correct' ? t('drawingCorrect') : t('drawingTryAgain') }}</b>
              <span>{{ t('drawingScore', { score: characterDrawScore || 0 }) }}</span>
            </div>

            <p class="character-hint-copy">{{ t('strokesInfo', { count: activeCharacter.strokes, hint: activeCharacter.hint }) }}</p>

            <div class="character-actions">
              <Button :label="characterHintVisible ? t('hideHint') : t('showHint')" icon="pi pi-eye" outlined @click="characterHintVisible = !characterHintVisible" />
              <Button :label="t('clearDrawing')" icon="pi pi-eraser" outlined :disabled="!characterHasDrawing" @click="clearCharacterCanvas" />
              <Button v-if="characterDrawFeedback !== 'correct'" :label="t('checkDrawing')" icon="pi pi-check" severity="contrast" :disabled="!characterHasDrawing" @click="compareCharacterDrawing" />
              <Button v-else :label="t('continuePractice')" icon="pi pi-arrow-right" severity="contrast" @click="rateCharacter('good')" />
              <Button :label="t('skipCharacter')" severity="danger" outlined @click="rateCharacter('hard')" />
            </div>
          </section>
          <div v-else class="empty-state">{{ t('addCharacterCards') }}</div>
        </div>

        <div v-else-if="currentView === 'dialogue'" class="page">
          <PageHead :eyebrow="t('dialogueEyebrow')" :title="t('dialogueTitle')" :copy="t('dialogueCopy')" />
          <section v-if="dialogues.length" class="dialogue-library">
            <Card
              v-for="(dialogue, index) in dialogues"
              :key="dialogue.id"
              :class="['dialogue-card', { active: activeDialogue?.id === dialogue.id }]"
              @click="selectDialogue(index)"
            >
              <template #content>
                <div class="word-card-head">
                  <Tag :value="dialogue.level" />
                  <span>{{ dialogue.lines.length }} {{ t('lines') }}</span>
                </div>
                <h2>{{ dialogue.title }}</h2>
                <p>{{ dialogue.goal }}</p>
              </template>
            </Card>
          </section>

          <section v-if="activeDialogue" class="dialogue-practice-layout">
            <div class="dialogue-thread compact-thread">
              <article
                v-for="item in visibleDialogueLines"
                :key="`${item.line.ja}-${item.index}`"
                :class="['bubble', { learner: item.line.speaker === 'learner' }]"
              >
                <small v-if="dialogueKanaVisible && lineKana(item.line)" class="kana-line">{{ lineKana(item.line) }}</small>
                <p class="jp">{{ item.line.ja }}</p>
                <small>{{ item.line.romaji }}</small>
                <b v-if="dialogueTranslationVisible">{{ item.line.en }}</b>
              </article>
            </div>

            <aside class="panel interactive-dialogue-panel">
              <template v-if="activeDialoguePrompt">
                <p class="eyebrow">{{ activeDialogue.setting }} · {{ t('turn') }} {{ (dialogueStep % dialoguePrompts.length) + 1 }} / {{ dialoguePrompts.length }}</p>
                <h2>{{ t('replyMessage') }}</h2>
                <div class="prompt-card">
                  <p class="speaker-label">{{ activeDialoguePrompt.prompt.speaker }}</p>
                  <small v-if="dialogueKanaVisible && lineKana(activeDialoguePrompt.prompt)" class="kana-line">{{ lineKana(activeDialoguePrompt.prompt) }}</small>
                  <p class="jp">{{ activeDialoguePrompt.prompt.ja }}</p>
                  <small>{{ activeDialoguePrompt.prompt.romaji }}</small>
                  <b v-if="dialogueTranslationVisible">{{ activeDialoguePrompt.prompt.en }}</b>
                  <div class="prompt-actions">
                    <Button icon="pi pi-volume-up" :label="t('listen')" text @click="speak(activeDialoguePrompt.prompt)" />
                    <Button
                      :label="dialogueKanaVisible ? t('hideHiragana') : t('showHiragana')"
                      icon="pi pi-language"
                      outlined
                      @click="dialogueKanaVisible = !dialogueKanaVisible"
                    />
                    <Button
                      :label="dialogueTranslationVisible ? t('hideTranslation') : t('showTranslation')"
                      icon="pi pi-eye"
                      outlined
                      @click="dialogueTranslationVisible = !dialogueTranslationVisible"
                    />
                  </div>
                </div>

                <div class="answer-options" :aria-disabled="Boolean(dialogueFeedback)">
                  <button
                    v-for="answer in dialogueAnswerOptions"
                    :key="answer"
                    :class="['answer-option', { selected: selectedDialogueAnswer === answer, correct: dialogueFeedback && answer === activeDialoguePrompt.answer.ja, wrong: dialogueFeedback === 'incorrect' && selectedDialogueAnswer === answer }]"
                    type="button"
                    :disabled="Boolean(dialogueFeedback)"
                    @click="checkDialogueAnswer(answer)"
                  >
                    <span class="jp">{{ answer }}</span>
                  </button>
                </div>

                <div v-if="dialogueFeedback" class="feedback-box">
                  <Tag :severity="dialogueFeedback === 'correct' ? 'success' : 'danger'" :value="dialogueFeedback === 'correct' ? t('correct') : t('tryThisReply')" />
                  <small v-if="dialogueKanaVisible && lineKana(activeDialoguePrompt.answer)" class="kana-line">{{ lineKana(activeDialoguePrompt.answer) }}</small>
                  <p class="jp">{{ activeDialoguePrompt.answer.ja }}</p>
                  <small>{{ activeDialoguePrompt.answer.romaji }}</small>
                  <b v-if="dialogueTranslationVisible">{{ activeDialoguePrompt.answer.en }}</b>
                  <div class="feedback-actions">
                    <Button icon="pi pi-volume-up" :label="t('listen')" outlined @click="speak(activeDialoguePrompt.answer)" />
                    <Button :label="t('nextTurn')" icon="pi pi-arrow-right" severity="contrast" @click="nextDialoguePrompt" />
                  </div>
                </div>
              </template>
              <div v-else class="empty-state small-empty">{{ t('dialogueNeedsPrompt') }}</div>
            </aside>
          </section>
          <div v-else class="empty-state">{{ t('noDialogues') }}</div>
        </div>

        <div v-else-if="currentView === 'admin'" class="page">
          <PageHead :eyebrow="t('adminEyebrow')" :title="t('manageDataTitle')" :copy="t('manageDataCopy')" :action-label="t('addWord')" action-icon="pi pi-plus" @action="openEntryDialog()" />
          <div class="tab-row">
            <Button v-for="tab in adminTabs" :key="tab.key" :label="t(tab.label)" :severity="adminTab === tab.key ? 'contrast' : 'secondary'" :outlined="adminTab !== tab.key" @click="adminTab = tab.key" />
          </div>

          <section v-if="adminTab === 'vocabulary'" class="panel table-panel">
            <ContextMenu ref="vocabularyContextMenu" :model="vocabularyContextMenuItems" />
            <DataTable
              v-model:context-menu-selection="selectedVocabularyRow"
              :value="filteredVocabulary"
              data-key="id"
              striped-rows
              context-menu
              responsive-layout="scroll"
              @row-contextmenu="openVocabularyContextMenu"
              @row-dblclick="openEntryDialog($event.data)"
            >
              <Column field="word" :header="t('word')" class="word-column">
                <template #body="slotProps"><span class="jp table-word">{{ slotProps.data.word }}</span></template>
              </Column>
              <Column field="reading" :header="t('reading')" class="reading-column" />
              <Column field="meaning" :header="t('meaning')" class="meaning-column" />
              <Column field="hint" :header="t('hint')" class="hint-column">
                <template #body="slotProps">
                  <span class="hint-cell">{{ slotProps.data.hint }}</span>
                </template>
              </Column>
            </DataTable>
          </section>

          <section v-else-if="adminTab === 'characters'" class="admin-stack">
            <form class="panel form-grid" @submit.prevent="saveCharacter">
              <FloatLabel><InputText id="char" v-model="characterForm.char" required /><label for="char">{{ t('character') }}</label></FloatLabel>
              <FloatLabel><InputText id="charReading" v-model="characterForm.reading" required /><label for="charReading">{{ t('reading') }}</label></FloatLabel>
              <FloatLabel><InputText id="charMeaning" v-model="characterForm.meaning" required /><label for="charMeaning">{{ t('meaning') }}</label></FloatLabel>
              <FloatLabel><Select id="charLevel" v-model="characterForm.level" :options="levelOptions" /><label for="charLevel">{{ t('level') }}</label></FloatLabel>
              <FloatLabel><InputNumber id="strokes" v-model="characterForm.strokes" :min="1" show-buttons /><label for="strokes">{{ t('strokes') }}</label></FloatLabel>
              <FloatLabel><InputText id="charHint" v-model="characterForm.hint" /><label for="charHint">{{ t('hint') }}</label></FloatLabel>
              <Button :label="t('addCharacter')" icon="pi pi-plus" severity="contrast" type="submit" />
            </form>
            <div class="word-grid">
              <Card v-for="entry in characters" :key="entry.id" class="word-card">
                <template #content>
                  <span class="jp word-token">{{ entry.char }}</span>
                  <b>{{ entry.reading }}</b>
                  <p>{{ entry.meaning }}</p>
                  <Button :label="t('delete')" severity="danger" outlined @click="deleteCharacter(entry)" />
                </template>
              </Card>
            </div>
          </section>

          <section v-else-if="adminTab === 'dialogues'" class="admin-stack">
            <form class="panel form-grid" @submit.prevent="saveDialogue">
              <FloatLabel><InputText id="dialogueTitle" v-model="dialogueForm.title" required /><label for="dialogueTitle">{{ t('title') }}</label></FloatLabel>
              <FloatLabel><Select id="dialogueLevel" v-model="dialogueForm.level" :options="levelOptions" /><label for="dialogueLevel">{{ t('level') }}</label></FloatLabel>
              <FloatLabel><InputText id="dialogueSetting" v-model="dialogueForm.setting" /><label for="dialogueSetting">{{ t('setting') }}</label></FloatLabel>
              <FloatLabel><InputText id="dialogueGoal" v-model="dialogueForm.goal" /><label for="dialogueGoal">{{ t('goal') }}</label></FloatLabel>
              <FloatLabel class="span-2"><Textarea id="dialogueLines" v-model="dialogueForm.lines" rows="7" required /><label for="dialogueLines">{{ t('linesJson') }}</label></FloatLabel>
              <Button :label="t('addDialogue')" icon="pi pi-plus" severity="contrast" type="submit" />
            </form>
            <div class="split-grid">
              <article v-for="entry in dialogues" :key="entry.id" class="panel">
                <p class="eyebrow">{{ entry.level }}</p>
                <h2>{{ entry.title }}</h2>
                <p>{{ entry.goal }}</p>
                <p>{{ entry.lines.length }} {{ t('lines') }}</p>
                <Button :label="t('delete')" severity="danger" outlined @click="deleteDialogue(entry)" />
              </article>
            </div>
          </section>

          <BackupPanel v-else :copy="backupPanelCopy" @export="exportDatabase" @reset="resetSeeds" @import-file="importDatabase" />
        </div>

        <div v-else-if="currentView === 'backup'" class="page">
          <PageHead :eyebrow="t('portableData')" :title="t('backupTitle')" :copy="t('backupCopy')" />
          <BackupPanel :copy="backupPanelCopy" @export="exportDatabase" @reset="resetSeeds" @import-file="importDatabase" />
        </div>
      </section>
    </main>

    <Dialog v-model:visible="flashTagDialogVisible" modal :header="t('practiceTags')" class="selection-dialog">
      <div class="selection-dialog-body">
        <div class="selection-actions">
          <span>{{ selectedFlashTags.length ? t('selectedTagCount', { count: selectedFlashTags.length }) : t('allTagsSelected') }}</span>
          <div>
            <Button :label="t('selectAll')" icon="pi pi-check-square" outlined @click="selectAllFlashTags" />
            <Button :label="t('deselectAll')" icon="pi pi-times" outlined @click="deselectAllFlashTags" />
          </div>
        </div>
        <div class="tag-picker dialog-picker" :aria-label="t('practiceTags')">
          <button
            v-for="tag in vocabularyTags"
            :key="tag"
            :class="['tag-toggle', { active: selectedFlashTags.includes(tag) }]"
            type="button"
            @click="toggleFlashTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
        <div class="dialog-actions">
          <Button :label="t('applySelection')" severity="contrast" type="button" @click="flashTagDialogVisible = false" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="flashVocabularyDialogVisible" modal :header="t('selectVocab')" class="selection-dialog">
      <div class="selection-dialog-body">
        <div class="selection-actions">
          <span>{{ t('selectedVocabCount', { count: selectedFlashVocabularyIds.length }) }}</span>
          <div>
            <Button :label="t('selectAll')" icon="pi pi-check-square" outlined @click="selectAllFlashVocabulary" />
            <Button :label="t('deselectAll')" icon="pi pi-times" outlined @click="deselectAllFlashVocabulary" />
          </div>
        </div>
        <div class="vocab-picker dialog-picker" :aria-label="t('selectVocab')">
          <button
            v-for="entry in flashTagFilteredVocabulary"
            :key="entry.id || entry.word"
            :class="['vocab-toggle', { active: entry.id && selectedFlashVocabularyIds.includes(entry.id) }]"
            type="button"
            @click="toggleFlashVocabulary(entry)"
          >
            <span class="jp">{{ entry.word }}</span>
            <small>{{ entry.meaning }}</small>
          </button>
        </div>
        <div class="dialog-actions">
          <Button :label="t('applySelection')" severity="contrast" type="button" @click="flashVocabularyDialogVisible = false" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="entryDialogVisible" modal :header="editingEntryId ? t('editWord') : t('addWord')" class="entry-dialog">
      <form class="form-grid dialog-form" @submit.prevent="saveVocabularyEntry">
        <FloatLabel><InputText id="word" v-model="entryForm.word" required /><label for="word">{{ t('word') }}</label></FloatLabel>
        <FloatLabel><InputText id="reading" v-model="entryForm.reading" required /><label for="reading">{{ t('reading') }}</label></FloatLabel>
        <FloatLabel><InputText id="romaji" v-model="entryForm.romaji" /><label for="romaji">{{ t('romaji') }}</label></FloatLabel>
        <FloatLabel><Select id="level" v-model="entryForm.level" :options="levelOptions" /><label for="level">{{ t('level') }}</label></FloatLabel>
        <FloatLabel class="span-2"><InputText id="meaning" v-model="entryForm.meaning" required /><label for="meaning">{{ t('meaning') }}</label></FloatLabel>
        <FloatLabel><InputText id="category" v-model="entryForm.category" /><label for="category">{{ t('category') }}</label></FloatLabel>
        <FloatLabel><InputText id="tags" v-model="entryForm.tags" /><label for="tags">{{ t('tags') }}</label></FloatLabel>
        <FloatLabel class="span-2"><Textarea id="hint" v-model="entryForm.hint" rows="3" /><label for="hint">{{ t('personalHint') }}</label></FloatLabel>
        <FloatLabel class="span-2"><Textarea id="exampleJa" v-model="entryForm.exampleJa" rows="2" /><label for="exampleJa">{{ t('exampleSentence') }}</label></FloatLabel>
        <FloatLabel class="span-2"><InputText id="exampleEn" v-model="entryForm.exampleEn" /><label for="exampleEn">{{ t('exampleTranslation') }}</label></FloatLabel>
        <div class="dialog-actions span-2">
          <Button :label="t('cancel')" outlined type="button" @click="entryDialogVisible = false" />
          <Button :label="t('saveEntry')" icon="pi pi-save" severity="contrast" type="submit" />
        </div>
      </form>
    </Dialog>
  </div>
</template>
