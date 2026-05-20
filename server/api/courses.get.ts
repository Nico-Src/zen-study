export default defineEventHandler(() => ({
	repository: 'zenstudy-example-japanese',
	version: '1.0.0',
	updatedAt: '2026-05-20T00:00:00.000Z',
	courses: [
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
			progress: 0,
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
			progress: 0,
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
}))
