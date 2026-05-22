export type ReviewKind = 'lesson' | 'vocabulary' | 'character' | 'dialogue'

export type ReviewItem = {
  id: string
  courseId: string
  kind: ReviewKind
  prompt: string
  dueAt: string
  attempts: number
  correct: number
  incorrect: number
  strength: number
  lastSeenAt?: string
}

type ReviewAttempt = {
  id: string
  courseId: string
  kind: ReviewKind
  prompt: string
  correct: boolean
  now?: Date
}

const intervalsByStrength = [0, 1, 3, 7, 14, 30]

export function reviewKey(kind: ReviewKind, courseId: string, itemId: string) {
  return `${courseId}:${kind}:${itemId}`
}

export function recordReviewAttempt(items: ReviewItem[] = [], attempt: ReviewAttempt) {
  const now = attempt.now || new Date()
  const existing = items.find(item => item.id === attempt.id)
  const nextStrength = Math.max(0, Math.min(intervalsByStrength.length - 1, (existing?.strength || 0) + (attempt.correct ? 1 : -1)))
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + intervalsByStrength[nextStrength])
  const nextItem: ReviewItem = {
    id: attempt.id,
    courseId: attempt.courseId,
    kind: attempt.kind,
    prompt: attempt.prompt,
    attempts: (existing?.attempts || 0) + 1,
    correct: (existing?.correct || 0) + (attempt.correct ? 1 : 0),
    incorrect: (existing?.incorrect || 0) + (attempt.correct ? 0 : 1),
    strength: nextStrength,
    dueAt: dueDate.toISOString(),
    lastSeenAt: now.toISOString()
  }
  return [...items.filter(item => item.id !== attempt.id), nextItem].sort((left, right) => left.dueAt.localeCompare(right.dueAt))
}

export function dueReviewItems(items: ReviewItem[] = [], now = new Date()) {
  const timestamp = now.getTime()
  return items.filter(item => Date.parse(item.dueAt) <= timestamp).sort((left, right) => {
    const urgency = Date.parse(left.dueAt) - Date.parse(right.dueAt)
    if (urgency) return urgency
    return right.incorrect - left.incorrect
  })
}

export function nextDueReviewItem(items: ReviewItem[] = [], kind?: ReviewKind, courseId?: string) {
  return dueReviewItems(items).find(item => (!kind || item.kind === kind) && (!courseId || item.courseId === courseId))
}