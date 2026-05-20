# ZenStudy Web App Plan

## Product Goal

ZenStudy is a local-first language learning web app. The app itself ships without course content. Users add one or more course repositories by URL, the app fetches course metadata and lesson content from those repositories, and downloaded courses plus all learning progress stay local in the browser's IndexedDB for now.

The first production target is a Nuxt web app using PrimeVue for UI components, Nuxt Icon for icons, Nuxt Fonts for typography, and Nuxt i18n for localization. A small test course repository server should be included for local development so repository import and sync flows can be tested without depending on a public service.

## Core Principles

- Course content is remote and repository-driven.
- Progress, streaks, XP, badges, settings, and repository subscriptions are local.
- The app supports multiple learning languages and multiple UI languages.
- Course data must be portable JSON with a versioned schema.
- Question rendering is generic, driven by typed course items and exercise definitions.
- The app should work offline after repositories have been synced.
- Repository failures should not destroy local progress or previously synced content.

## Target Stack

- Frontend: Nuxt 3 / Vue 3.
- UI: PrimeVue and PrimeVue themes.
- Icons: Nuxt Icon with Iconify icon sets.
- Fonts: Nuxt Fonts.
- Localization: Nuxt i18n.
- Local persistence: IndexedDB in the browser for repository subscriptions, downloaded course snapshots, creator drafts, progress, XP, streaks, badges, and settings.
- Test repository backend: a small local server exposing a versioned courses endpoint. Use Nuxt Nitro server routes if we want it inside the same dev app, or a minimal Node/Express server if we want to simulate a separate origin.

## Main User Flows

### 1. Add Course Repository

1. User opens Course Repositories.
2. User enters or selects a repository server URL.
3. App fetches the repository manifest from `GET {repositoryUrl}/courses`.
4. App validates schema version, required fields, languages, course IDs, and content URLs.
5. App shows all available courses for that repository.
6. Each course row/card shows name, source language, target language, version, optional level range, optional tags, and sync status.
7. User presses add on one course, multiple courses, or all available courses.
8. App stores repository metadata and downloaded course snapshots in IndexedDB.

### 2. Start Course

1. User chooses a course.
2. App shows levels, units, lessons, dialogues, vocabulary sets, grammar notes, and checkpoints.
3. User starts the next unlocked lesson.
4. Lesson session generates exercises from course item definitions.
5. Results update mastery, XP, streak data, checkpoint status, and course progress locally.

### 3. Practice Across Courses

1. User opens Practice.
2. App offers due review, weak words, listening/dialogue practice, checkpoints, or custom filters.
3. App pulls eligible items from local synced courses.
4. Session results update item-level spaced repetition and global gamification.

### 4. Continue Offline

1. User launches app with no network.
2. App reads synced courses and progress from local storage.
3. Repository sync controls show offline/unavailable state.
4. Learning remains usable for already synced content.

### 5. Create Course

1. User opens Course Creator.
2. User creates course metadata, languages, levels, units, lessons, checkpoints, content items, and exercises.
3. User validates the course against the same schema used by repositories.
4. User exports course JSON that can be uploaded to a course repository server.
5. User can also import a course JSON export directly into local repository subscriptions for testing.

## Course Repository Model

Repositories are content catalogs. They do not know the user's progress.

### Repository Endpoint

Required endpoint for each repository:

```http
GET /courses
```

The app should also support full URLs like:

```text
https://example.com/language-repo/courses
```

### Repository Manifest Shape

```json
{
  "schemaVersion": "1.0.0",
  "repository": {
    "id": "example-japanese-repo",
    "name": "Example Japanese Courses",
    "description": "Development course repository for Japanese learners.",
    "homepage": "https://example.com",
    "maintainer": "Example Team",
    "updatedAt": "2026-05-20T00:00:00.000Z"
  },
  "courses": [
    {
      "id": "ja-en-foundations-a1",
      "slug": "japanese-foundations-a1",
      "title": "Japanese Foundations A1",
      "description": "Beginner Japanese for English speakers.",
      "sourceLanguage": "en",
      "targetLanguage": "ja",
      "uiLanguages": ["en", "de"],
      "levels": ["A1"],
      "tags": ["beginner", "travel", "kana"],
      "version": "1.0.0",
      "updatedAt": "2026-05-20T00:00:00.000Z",
      "license": "CC-BY-4.0",
      "contentUrl": "https://example.com/language-repo/courses/ja-en-foundations-a1.json",
      "checksum": "sha256-placeholder",
      "stats": {
        "levels": 1,
        "units": 6,
        "lessons": 42,
        "items": 800,
        "dialogues": 12,
        "sentences": 120,
        "words": 450,
        "characters": 90,
        "characterTables": 2,
        "checkpoints": 6
      }
    }
  ]
}
```

### Course Content Shape

```json
{
  "schemaVersion": "1.0.0",
  "courseId": "ja-en-foundations-a1",
  "version": "1.0.0",
  "sourceLanguage": "en",
  "targetLanguage": "ja",
  "title": { "en": "Japanese Foundations A1", "de": "Japanisch Grundlagen A1" },
  "levels": [
    {
      "id": "a1",
      "title": { "en": "A1" },
      "units": [
        {
          "id": "a1-unit-1",
          "title": { "en": "First Words" },
          "lessons": [
            {
              "id": "a1-unit-1-lesson-1",
              "title": { "en": "Greetings" },
              "itemIds": ["vocab-konnichiwa", "dialogue-cafe-hello"],
              "exerciseIds": ["ex-konnichiwa-meaning", "ex-konnichiwa-translate"],
              "xpReward": 20
            }
          ],
          "checkpoint": {
            "id": "a1-unit-1-checkpoint",
            "title": { "en": "Greetings Checkpoint" },
            "exerciseIds": ["checkpoint-greetings-1"],
            "passingScore": 80,
            "xpReward": 75
          }
        }
      ]
    }
  ],
  "items": [],
  "exercises": []
}
```

## Content Types

Courses can contain dialogues, sentences, characters, words, and character tables. These content types are reusable source material. Exercises decide how the learner practices that material.

### Vocabulary Item

Used for word meaning, reverse translation, typing, listening, and sentence exercises.

```json
{
  "id": "vocab-konnichiwa",
  "type": "vocabulary",
  "target": {
    "text": "こんにちは",
    "reading": "こんにちは",
    "romanization": "konnichiwa",
    "audioUrl": null
  },
  "source": {
    "text": "hello"
  },
  "partOfSpeech": "interjection",
  "level": "A1",
  "tags": ["greeting"],
  "examples": [
    {
      "target": "こんにちは、元気ですか。",
      "source": "Hello, how are you?"
    }
  ]
}
```

### Dialogue Item

Used for conversation practice, line ordering, response choice, listening, and roleplay.

```json
{
  "id": "dialogue-cafe-hello",
  "type": "dialogue",
  "title": { "en": "At the Cafe" },
  "setting": { "en": "Ordering coffee" },
  "level": "A1",
  "lines": [
    {
      "speaker": "staff",
      "target": "いらっしゃいませ。",
      "reading": "いらっしゃいませ。",
      "romanization": "irasshaimase",
      "source": "Welcome."
    },
    {
      "speaker": "learner",
      "target": "コーヒーをお願いします。",
      "reading": "コーヒーをおねがいします。",
      "romanization": "koohii o onegaishimasu",
      "source": "Coffee, please."
    }
  ]
}
```

### Sentence Item

Used for sentence translation, fill-in-the-blank, word ordering, listening, and grammar pattern practice.

```json
{
  "id": "sentence-please-coffee",
  "type": "sentence",
  "target": "コーヒーをお願いします。",
  "reading": "コーヒーをおねがいします。",
  "romanization": "koohii o onegaishimasu",
  "source": "Coffee, please.",
  "level": "A1",
  "tags": ["cafe", "request"],
  "wordIds": ["vocab-coffee", "vocab-please"],
  "grammarTags": ["object-marker-o"]
}
```

### Character Item

Used for kanji, kana, alphabet letters, radicals, stroke practice, recognition, and reading drills.

```json
{
  "id": "char-water",
  "type": "character",
  "character": "水",
  "readings": ["みず", "すい"],
  "meanings": ["water"],
  "romanization": ["mizu", "sui"],
  "level": "A1",
  "strokeCount": 4,
  "tags": ["kanji", "nature"],
  "components": [],
  "strokeOrderUrl": null
}
```

### Character Table Item

Used for hiragana, katakana, alphabets, syllabaries, abjads, or other writing-system charts. Tables can power recognition, recall, typing, matching, and table-completion practice.

```json
{
  "id": "table-hiragana-basic",
  "type": "character-table",
  "title": { "en": "Basic Hiragana" },
  "system": "hiragana",
  "level": "A1",
  "tags": ["kana", "writing-system"],
  "columns": ["a", "i", "u", "e", "o"],
  "rows": [
    {
      "label": "vowels",
      "cells": [
        { "character": "あ", "reading": "a", "audioUrl": null },
        { "character": "い", "reading": "i", "audioUrl": null },
        { "character": "う", "reading": "u", "audioUrl": null },
        { "character": "え", "reading": "e", "audioUrl": null },
        { "character": "お", "reading": "o", "audioUrl": null }
      ]
    }
  ]
}
```

### Future Item Types

- Grammar pattern items.
- Listening-only prompts.
- Speaking prompts.
- Culture notes.
- Reading passages.

## Exercise Types

Exercise definitions reference item IDs. This keeps content reusable and allows the app to render different question modes from the same source item.

Initial exercise types:

- `meaning-choice`: show target word, choose source meaning.
- `reverse-translation-choice`: show source word, choose target translation.
- `typing-target`: show source, type target.
- `typing-source`: show target, type source.
- `listening-choice`: play target audio, choose meaning or target text.
- `sentence-translation`: show a sentence in one language, translate it into the other language.
- `sentence-fill`: fill a missing word in an example sentence.
- `sentence-order`: arrange words or chunks into the correct sentence.
- `character-meaning-choice`: show a character, choose its meaning.
- `character-reading-choice`: show a character, choose its reading.
- `character-writing`: draw or type a character.
- `character-table-match`: match table characters to readings.
- `character-table-complete`: fill missing cells in a character table.
- `dialogue-response-choice`: choose the best learner response.
- `dialogue-order-lines`: arrange dialogue lines.
- `checkpoint-mixed`: generated mixed quiz from lesson or unit content.

Example:

```json
{
  "id": "ex-konnichiwa-meaning",
  "type": "meaning-choice",
  "itemId": "vocab-konnichiwa",
  "promptLanguage": "target",
  "answerLanguage": "source",
  "difficulty": 1,
  "xp": 5
}
```

## Local Data Model

The app should use IndexedDB for all local app data. Downloaded course snapshots are stored locally so courses remain usable offline and repository outages do not affect existing subscriptions.

Recommended IndexedDB stores:

- `repositories`: URL, repository ID, manifest snapshot, trust state, last sync state.
- `courses`: repository ID, course ID, version, metadata, content snapshot, sync timestamps.
- `course_imports`: course JSON files imported directly into local subscriptions for testing or personal use.
- `creator_drafts`: in-progress course creator projects and autosaves.
- `course_progress`: course ID, active level/unit/lesson, completed lessons, checkpoint results.
- `item_progress`: course ID, item ID, mastery, due date, correct count, wrong count, last seen.
- `exercise_attempts`: session ID, course ID, exercise ID, answer, correctness, duration, created date.
- `sessions`: lesson/practice/checkpoint sessions with score, XP, completion status.
- `profile`: display name, selected UI language, daily goal, XP, level, streak fields.
- `badges`: badge ID, earned date, source event.
- `settings`: app preferences, sync options, accessibility/display settings.

## Course Creator

The app should include an extensive course creator for building repository-compatible courses without hand-writing JSON.

### Creator Scope

- Course metadata editor for title, description, language pair, version, license, tags, levels, and optional artwork.
- Level, unit, lesson, and checkpoint builder.
- Content editors for words, sentences, dialogues, characters, and character tables.
- Exercise builder for all supported exercise types.
- Relationship tools for linking lessons to items, exercises to items, checkpoints to exercises, and sentences to related words or grammar tags.
- Validation panel that reports missing translations, duplicate IDs, broken references, unsupported exercise types, and schema mismatches.
- Preview mode for lessons, practice sessions, dialogues, character table drills, and checkpoints.
- Autosaved drafts in IndexedDB.

### Creator Export and Import

- Export a complete course JSON file matching the repository course content schema.
- Export a repository manifest entry for the course so it can be added to a server's `/courses` response.
- Import an exported course JSON directly into the app as a local course subscription.
- Import an exported course JSON back into the creator for editing.
- Preserve stable IDs during editing so learner progress survives course updates.

The creator does not publish to arbitrary servers in v1. It prepares valid files that can be added to a repository server manually.

## Progress Rules

### Lesson Completion

- A lesson is complete when required exercises are answered and the minimum score is met.
- Lesson completion awards lesson XP once.
- Repeating a lesson awards reduced practice XP.
- Completing all lessons in a unit unlocks the unit checkpoint.

### Checkpoints

- Checkpoints are mixed assessments for a unit or level.
- Passing score defaults to 80 unless course content overrides it.
- Passing a checkpoint unlocks the next unit or level.
- Failed checkpoints should identify weak item categories and schedule reviews.

### Item Mastery

- Each item has local mastery from 0 to 100.
- Correct answers increase mastery and push due date into the future.
- Wrong answers lower mastery and make the item due sooner.
- Different exercise types can apply different weights.

## Gamification

### XP

- Exercise XP: usually 3 to 10 XP.
- Lesson completion XP: usually 15 to 30 XP.
- Checkpoint XP: usually 50 to 100 XP.
- Daily goal bonus: small bonus when the daily goal is met.
- Repeat sessions can award reduced XP to avoid farming.

### Account Level

Use a simple curve at first:

```text
requiredXpForLevel = 100 + ((level - 1) * 50)
```

Store lifetime XP and derive current level from it. Keep the formula local so it can be tuned later without changing course content.

### Streaks

- A streak day counts when the user earns at least the configured daily goal XP or completes one lesson/practice session.
- Store `lastActiveDate`, `currentStreak`, and `longestStreak` locally.
- Use the user's local calendar day.
- Add a grace state later if needed, but keep v1 simple.

### Badges

Initial badge categories:

- First lesson completed.
- First repository added.
- First course completed.
- First checkpoint passed.
- 3, 7, 14, 30 day streaks.
- 100, 500, 1000, 5000 XP earned.
- 50, 250, 1000 exercises answered.
- Perfect checkpoint.
- Dialogue practice milestone.

Badges should be computed from local events and stored once earned.

## UI Structure

### App Shell

- Sidebar or responsive bottom navigation.
- Top bar with current course, streak, XP level, sync status, and profile/settings entry.
- PrimeVue Toast for sync/import/errors.
- PrimeVue Dialog/Drawer for repository management and session summaries.

### Main Views

- Dashboard: daily goal, continue lesson, due review, streak, XP, badges, current courses.
- Courses: subscribed courses, repository catalog, course detail, level/unit/lesson map.
- Course Creator: draft courses, edit content, validate schema, preview lessons, export JSON, import JSON.
- Practice: due review, weak items, dialogue practice, custom practice filters.
- Lesson Session: focused exercise renderer with feedback and progress.
- Dialogue Session: conversation interface with response choices, reveal controls, audio later.
- Checkpoint: assessment mode with summary and unlock result.
- Repositories: add URL, validate, sync, remove, inspect manifest.
- Progress: XP history, badges, streak calendar, course completion.
- Settings: UI language, daily goal, font/display preferences, data export/import.

## Internationalization

There are two different language concerns:

- UI language: app chrome, buttons, messages, settings.
- Course language pair: source language and target language for learning content.

Use Nuxt i18n for app UI localization, locale routing if needed, fallback messages, language switching, and persisted UI language preference. Course content translations come from course repositories. The course schema should store localized labels as objects keyed by BCP 47 language code, such as `{ "en": "Greetings", "de": "Begrussungen" }`.

## Repository Sync and Validation

### Validation Rules

- Manifest must include supported `schemaVersion`.
- Repository ID and course IDs must be stable strings.
- Course IDs must be unique inside a repository.
- `contentUrl` must be valid and fetchable.
- Course content must match `courseId` and declared `version`.
- Levels, units, lessons, items, and exercises must have unique IDs.
- Exercise references must point to existing items.
- Checkpoint references must point to existing exercises.
- Course creator exports must pass the same validation before they can be imported as local subscriptions.

### Sync Strategy

- Fetch manifest.
- Compare course versions and update timestamps.
- Fetch changed course content only.
- Store downloaded course snapshots in IndexedDB.
- Store previous course snapshot until new snapshot validates.
- Preserve local progress by course ID and item/exercise IDs.
- If content removes an item, mark progress as orphaned but do not delete it immediately.

## Test Repository Server

For development, add a tiny server that exposes:

```http
GET /courses
GET /courses/:courseId
```

The test server may contain sample data because it is not the app's bundled learning content. Its job is to prove repository discovery, validation, sync, and course loading.

Recommended first implementation:

- Add `server/api/test-repository/courses.get.ts` for same-origin development.
- Add `server/api/test-repository/courses/[courseId].get.ts` for course content.
- The app can add `http://localhost:3000/api/test-repository` as a repository URL in development.

If separate-origin CORS behavior needs testing, add a small standalone Node server later under `tools/course-repository-server`.

## Implementation Milestones

### Milestone 1: Foundation

- Rename app identity from Japanese-only study app to generic ZenStudy language learning.
- Add TypeScript domain types for repositories, course manifests, course content, exercises, progress, XP, streaks, and badges.
- Configure Nuxt i18n with initial UI locales, fallback locale, and persisted language selection.
- Add schema validators for repository manifest and course content.
- Create IndexedDB stores for repositories, downloaded courses, creator drafts, profile, progress, sessions, and badges.

### Milestone 2: Repository Management

- Build repository add/list/remove UI.
- Implement manifest fetch and validation.
- Implement repository course catalog with add buttons per course and an add-all action.
- Show course name, language pair, version, optional tags, level range, and local sync status.
- Implement course subscription and IndexedDB snapshot storage.
- Add clear sync error states.

### Milestone 3: Course Map

- Render courses with levels, units, lessons, and checkpoints.
- Implement unlock rules.
- Add lesson detail preview with exercise count and XP reward.
- Store selected active course locally.

### Milestone 4: Exercise Engine

- Build generic exercise renderer by exercise type.
- Implement vocabulary meaning and reverse translation questions.
- Implement sentence translation, sentence fill-in, and sentence ordering questions.
- Implement character and character table practice questions.
- Implement typing questions with tolerant answer normalization.
- Implement dialogue response choices.
- Add session summary and local attempt recording.

### Milestone 4.5: Course Creator

- Build the course metadata, structure, content, and exercise editors.
- Add IndexedDB autosaved drafts.
- Add schema validation and broken-reference reporting.
- Add preview mode for lessons and checkpoints.
- Add course JSON export.
- Add direct JSON import into local subscriptions.

### Milestone 5: Progress and Gamification

- Implement XP award service.
- Implement account level calculation.
- Implement streak updates.
- Implement badge unlock checks.
- Add dashboard widgets for daily goal, streak, XP, level, and badges.

### Milestone 6: Checkpoints

- Implement checkpoint session mode.
- Apply passing score and unlock next unit/level.
- Show weak areas after failed checkpoint.
- Record checkpoint attempts locally.

### Milestone 7: Polish and Offline Readiness

- Improve empty states and loading states.
- Add data export/import for local progress.
- Add repository resync controls.
- Add offline indicators.
- Add tests around validators, progress rules, and exercise grading.

## Testing Plan

- Unit tests for schema validation.
- Unit tests for XP, streak, level, badge, mastery, and unlock rules.
- Unit tests for answer normalization.
- Integration tests for repository add/sync/update flows.
- Integration tests for course creator export and direct JSON import.
- E2E tests for adding the test repository, subscribing to a course, completing a lesson, earning XP, and passing a checkpoint.

## Open Decisions

- Whether the test repository should live only as Nuxt server routes or also as a separate standalone server.
- Whether to use native IndexedDB APIs directly or a small wrapper library for cleaner querying and migrations.
- Whether course schemas should be validated with Zod, Valibot, or custom validators.
- Whether audio assets are remote URLs only in v1 or can be cached locally.
- Whether user accounts/cloud sync are intentionally out of scope for this phase.

## Suggested Next Step

Start with Milestone 1 and Milestone 2 together: define the repository/course schema, add validators, add IndexedDB stores, add the test repository endpoint, and build the repository management UI. That creates the backbone for every later learning feature and for the course creator.