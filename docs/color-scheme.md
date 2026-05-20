# ZenStudy Color Scheme

## Direction

ZenStudy should feel calm, focused, and lightweight, inspired by the Bunpo-style lesson screens in the reference: lots of white space, soft gray structure, rounded mobile surfaces, a friendly green progress signal, and small bright accents for moments of feedback.

The design should not copy Bunpo directly. Use the same broad mood: clean lesson cards, gentle shadows, friendly illustrations, compact answer choices, and high-confidence learning states.

## Palette

### Core

| Token | Hex | Use |
| --- | --- | --- |
| `--zs-bg` | `#FAFAF8` | App background, page canvas |
| `--zs-surface` | `#FFFFFF` | Cards, lesson panels, dialogs |
| `--zs-surface-soft` | `#F6F6F3` | Subtle panels, inactive controls |
| `--zs-border` | `#E8E8E3` | Card borders, dividers, answer outlines |
| `--zs-border-strong` | `#D8D8D2` | Focused or selected neutral borders |
| `--zs-text` | `#2F302D` | Primary text |
| `--zs-text-muted` | `#75776F` | Captions, secondary labels |
| `--zs-text-soft` | `#A9AAA4` | Disabled text, metadata |

### Brand And Learning States

| Token | Hex | Use |
| --- | --- | --- |
| `--zs-primary` | `#2F73F6` | Main action buttons, selected navigation |
| `--zs-primary-hover` | `#1E61DD` | Primary hover/pressed state |
| `--zs-primary-soft` | `#EAF1FF` | Soft selected state, badges, backgrounds |
| `--zs-progress` | `#4FC35B` | Lesson progress bars, success streaks |
| `--zs-progress-soft` | `#E9F8EB` | Success backgrounds |
| `--zs-warning` | `#FFD84D` | Audio buttons, hints, attention moments |
| `--zs-warning-soft` | `#FFF7CF` | Hint backgrounds |
| `--zs-danger` | `#F06565` | Incorrect answers, destructive actions |
| `--zs-danger-soft` | `#FDECEC` | Error backgrounds |

### Course Accent Set

Use accents to distinguish course types, content categories, and creator sections. Keep them secondary; the UI should still mostly read as white, soft gray, green, and blue.

| Token | Hex | Suggested Use |
| --- | --- | --- |
| `--zs-accent-pink` | `#F6A7B8` | Dialogues, speaking practice |
| `--zs-accent-mint` | `#84D9B6` | Words, vocabulary sets |
| `--zs-accent-sky` | `#8AC5FF` | Listening, audio, pronunciation |
| `--zs-accent-lavender` | `#BBA7FF` | Characters, writing systems |
| `--zs-accent-peach` | `#FFB58A` | Sentences, grammar patterns |

## Semantic Use

- Primary action: blue.
- Progress and correct states: green.
- Audio, hints, and special lesson moments: yellow.
- Incorrect or destructive states: red.
- Course/category identity: pastel accent set.
- Most backgrounds: warm white or near-white gray.
- Most borders: visible but quiet, with no heavy outlines unless focused.

## Component Guidance

### App Shell

- Background should use `--zs-bg`.
- Main content surfaces should use `--zs-surface` with subtle borders.
- Navigation selected state should use blue text/icon plus a soft blue background.
- Top progress indicators should use green over a pale gray track.

### Lesson Screens

- Lesson panels should feel like clean paper cards on a warm off-white canvas.
- Progress bar: `--zs-progress` on `#EDEDEA`.
- Close/back icons should be muted gray by default and darken on hover.
- Continue buttons should be blue, compact, rounded, and centered on mobile lesson screens.
- Audio controls should use yellow circles with white icons.

### Answer Choices

- Default: white background, gray border, dark text.
- Hover: slightly warmer surface and stronger border.
- Selected: soft blue background and blue border.
- Correct: soft green background, green border, dark text.
- Incorrect: soft red background, red border, dark text.

### Course Repository And Creator

- Repository/course cards should remain restrained and scannable.
- Use small pastel swatches for content type counts: words, sentences, dialogues, characters, and character tables.
- Creator validation should use clear semantic colors but avoid a loud dashboard feel.
- JSON export/import controls should use familiar icons and compact buttons.

## Typography

Recommended Nuxt Fonts families:

- UI: `Manrope` for rounded, friendly clarity.
- Japanese and CJK content: `Noto Sans JP`.
- Code/JSON preview: `JetBrains Mono` or `Geist Mono` if added later.

Type should feel compact and readable. Avoid oversized marketing-style hero typography inside the app. Lesson prompts can be larger, but dashboards, repository lists, and creator panels should stay dense enough for repeated work.

## CSS Tokens

```css
:root {
  --zs-bg: #fafaf8;
  --zs-surface: #ffffff;
  --zs-surface-soft: #f6f6f3;
  --zs-border: #e8e8e3;
  --zs-border-strong: #d8d8d2;
  --zs-text: #2f302d;
  --zs-text-muted: #75776f;
  --zs-text-soft: #a9aaa4;

  --zs-primary: #2f73f6;
  --zs-primary-hover: #1e61dd;
  --zs-primary-soft: #eaf1ff;
  --zs-progress: #4fc35b;
  --zs-progress-soft: #e9f8eb;
  --zs-warning: #ffd84d;
  --zs-warning-soft: #fff7cf;
  --zs-danger: #f06565;
  --zs-danger-soft: #fdecec;

  --zs-accent-pink: #f6a7b8;
  --zs-accent-mint: #84d9b6;
  --zs-accent-sky: #8ac5ff;
  --zs-accent-lavender: #bba7ff;
  --zs-accent-peach: #ffb58a;
}
```

## PrimeVue Theme Notes

- Use Aura as the base theme, then override app-level tokens in `assets/css/main.css`.
- Keep PrimeVue component radii moderate: `8px` for cards and lists, `999px` only for circular icon buttons, progress pills, and small badges.
- Buttons should be compact and confident, not oversized.
- Inputs and answer choices should use clear focus rings using `--zs-primary-soft` plus `--zs-primary`.

## Accessibility

- Do not communicate correctness by color alone. Include icons and text labels where appropriate.
- Maintain strong text contrast on white and soft surfaces.
- Keep yellow mostly as a background or icon button color; avoid yellow text.
- Ensure progress and streak indicators have accessible labels.