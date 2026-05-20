# Stitch Mockup Prompt

Use this prompt in Stitch to generate ZenStudy mockups.

```text
Create high-fidelity mobile and desktop app mockups for ZenStudy, a local-first language learning web app. The app lets users add course repository URLs, browse available courses from each repository, download selected courses into IndexedDB, practice lessons offline, track XP/streaks/badges, and create/export/import course JSON through an extensive course creator.

Visual direction:
Use a calm Bunpo-inspired learning-app aesthetic without copying Bunpo exactly. The UI should feel clean, friendly, focused, and lightweight: warm white backgrounds, soft gray borders, rounded lesson surfaces, generous whitespace, compact answer choices, a green lesson progress bar, blue primary actions, yellow audio/hint buttons, and small pastel content accents. Use playful educational illustrations as placeholders, but keep the UI polished and production-ready.

Color palette:
- Background: #FAFAF8
- Surface: #FFFFFF
- Soft surface: #F6F6F3
- Border: #E8E8E3
- Primary text: #2F302D
- Muted text: #75776F
- Primary action blue: #2F73F6
- Progress/success green: #4FC35B
- Hint/audio yellow: #FFD84D
- Incorrect/destructive red: #F06565
- Pastel accents: pink #F6A7B8, mint #84D9B6, sky #8AC5FF, lavender #BBA7FF, peach #FFB58A

Typography:
Use Manrope for the app UI and Noto Sans JP for Japanese/CJK learning content. Keep the typography compact and friendly. Avoid marketing-style hero sections. This is a usable app, not a landing page.

Create the following screens:

1. Mobile Dashboard
- Top area with ZenStudy wordmark, current streak, XP level, and daily goal progress.
- Continue lesson card with course name, language pair, level, progress bar, and a primary Continue button.
- Due review section with words, sentences, dialogues, characters, and character table counts.
- Recent badges strip using small pastel badge chips.
- Bottom navigation with icons for Dashboard, Courses, Practice, Creator, and Settings.

2. Mobile Lesson Exercise
- Full-screen focused lesson layout.
- Top close icon, green progress bar, and small settings/audio icon.
- Prompt card with an illustration placeholder, optional audio button, target/source text, and compact instruction text.
- Answer options as stacked rounded rectangles.
- Show one selected state and one correct/incorrect feedback variant.
- Bottom primary action button labeled Continue.

3. Mobile Character Table Practice
- Focused practice screen for hiragana or another writing-system table.
- Top progress bar.
- A compact character table with some cells hidden.
- Prompt asks the learner to match or fill missing readings.
- Use lavender accent for character-table content and yellow for audio hints.

4. Desktop Course Repository Browser
- App shell with left sidebar navigation and a top status bar.
- Repository selector/add URL field.
- Course list for the selected repository.
- Each course card/row shows course name, source language, target language, version, optional tags, level range, content counts, and Add button.
- Include Add all available courses action.
- Show local sync status: Not added, Downloaded, Update available, or Error.

5. Desktop Course Creator
- Dense but clean creator workspace.
- Left sidebar with course structure: levels, units, lessons, checkpoints.
- Main editor area with tabs for Metadata, Words, Sentences, Dialogues, Characters, Character Tables, Exercises, and Preview.
- Right validation panel showing schema status, broken references, duplicate IDs, and export readiness.
- Include JSON Export and Import JSON actions.
- Use pastel accents by content type, but keep the workspace mostly white and focused.

6. Desktop Course Map
- Shows one downloaded course with levels, units, lessons, and checkpoints.
- Lessons appear as compact nodes or cards with locked/unlocked/completed states.
- Checkpoints are visually distinct but not oversized.
- Include XP reward, estimated time, and content-type summary.

Interaction and component style:
- Use familiar icons in navigation and buttons.
- Buttons should be compact, rounded, and confident.
- Cards should have subtle borders and soft shadows, with radius around 8px.
- Do not nest cards inside cards.
- Avoid purple-gradient AI aesthetics, oversized hero text, dark dashboards, and generic SaaS layouts.
- The app should feel like a serious learning tool with a playful educational touch.

Output requirements:
- Provide both mobile and desktop mockups.
- Keep screens visually consistent across the product.
- Prioritize real usable workflows over decorative marketing screens.
- Make text readable and ensure no UI elements overlap.
- Include enough detail that the mockups can guide a Nuxt + PrimeVue implementation.
```

## Shorter Variation

```text
Design ZenStudy, a local-first language learning app. Make it Bunpo-inspired but original: warm white canvas, soft gray borders, green progress bars, blue primary buttons, yellow audio/hint buttons, compact answer choices, friendly illustrations, and pastel accents for content types. Create mobile and desktop mockups for Dashboard, Lesson Exercise, Character Table Practice, Course Repository Browser, Course Creator, and Course Map. Include repository course adding, IndexedDB downloaded course state, XP/streak/badges, JSON export/import, and schema validation. Use Manrope for UI and Noto Sans JP for Japanese/CJK content. Avoid landing-page design, dark dashboards, purple gradients, and generic SaaS layouts.
```