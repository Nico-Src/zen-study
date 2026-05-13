---
name: Modern Zen
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#454652'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#767683'
  outline-variant: '#c6c5d4'
  surface-tint: '#4c56af'
  primary: '#000666'
  on-primary: '#ffffff'
  primary-container: '#1a237e'
  on-primary-container: '#8690ee'
  inverse-primary: '#bdc2ff'
  secondary: '#805062'
  on-secondary: '#ffffff'
  secondary-container: '#fec1d6'
  on-secondary-container: '#7b4c5e'
  tertiary: '#181b23'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c3039'
  on-tertiary-container: '#9597a2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000767'
  on-primary-fixed-variant: '#343d96'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#f2b6cb'
  on-secondary-fixed: '#330f1f'
  on-secondary-fixed-variant: '#65394b'
  tertiary-fixed: '#e0e2ee'
  tertiary-fixed-dim: '#c4c6d2'
  on-tertiary-fixed: '#181b24'
  on-tertiary-fixed-variant: '#434750'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  japanese-display:
    fontFamily: Noto Serif
    fontSize: 40px
    fontWeight: '500'
    lineHeight: '1.5'
  japanese-body:
    fontFamily: Noto Serif
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.8'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  max-width-content: 1024px
---

## Brand & Style
The design system is built upon the "Modern Zen" philosophy, a synthesis of traditional Japanese minimalism and contemporary digital clarity. It targets serious learners seeking a sanctuary for focus, away from the gamified noise of typical educational apps. 

The visual style blends **Minimalism** with **Tactile** elements. By utilizing high-quality paper textures and generous negative space, the UI evokes the feeling of a clean desk and a fresh notebook. The emotional goal is to reduce cognitive load and foster a state of *zanshin* (relaxed alertness). Interactions are intentional, transitions are soft, and the overall composition prioritizes the quiet beauty of the Japanese written language.

## Colors
The palette is rooted in the contrast between **Deep Indigo** (#1A237E), representing ink and scholarly depth, and **Warm Off-White** (#FAFAFA), mimicking *washi* paper. **Cherry Blossom Pink** (#F8BBD0) is used sparingly as an accent for highlights, progress indicators, and soft call-to-actions.

A tertiary **Indigo Tint** (#E8EAF6) provides subtle differentiation for container backgrounds without breaking the monochromatic calm. Text is never pure black; it uses a high-contrast charcoal for the primary reading experience to reduce eye strain during long study sessions.

## Typography
This design system employs a dual-typeface strategy. **Manrope** serves as the primary UI font, chosen for its modern, balanced, and professional geometric structure. It handles all navigational elements, instructions, and Romanized text.

For Japanese characters (Kanji, Hiragana, Katakana), **Noto Serif** is mandated. The serif strokes provide a scholarly, literary quality that honors the calligraphic history of the language. Line heights are intentionally generous (1.6 to 1.8) to allow complex characters to breathe and to improve legibility for learners.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to maintain a "contained" and organized feel, centering content within a 1024px maximum width. On mobile, it transitions to a fluid single-column layout with 16px side margins.

Spacing is governed by an 8px rhythmic scale. However, this design system advocates for "Extra-Negative Space"—increasing standard margins by 1.5x in study modes to eliminate peripheral distractions. Sections are separated by large white space gaps rather than heavy dividers, allowing the user's eye to move naturally across the page.

## Elevation & Depth
Elevation in this design system is understated. It avoids heavy dropshadows in favor of **Ambient Shadows**—soft, extremely diffused blurs with a slight Indigo tint (#1A237E at 5% opacity). This creates a sense of elements resting gently on paper rather than floating in space.

Depth is primarily established through **Tonal Layering**. The base layer is the paper texture (#FAFAFA). Secondary containers (like flashcards or sidebars) use a subtle Indigo Tint (#E8EAF6) or a pure white surface with a thin, 1px border in a slightly darker neutral shade.

## Shapes
The shape language is **Rounded**, utilizing a 0.5rem (8px) corner radius for standard components. This softens the interface, making the "Scholarly" environment feel "Accessible." 

Large containers and cards use `rounded-lg` (16px) to emphasize their role as distinct physical objects in the workspace. Interactive elements like buttons and chips maintain the standard 8px radius to keep a crisp, modern edge that aligns with the geometric precision of the Manrope typeface.

## Components
- **Buttons:** Primary buttons are solid Deep Indigo with white text. Secondary buttons use a Ghost style with an Indigo border. All buttons feature a subtle 2px vertical offset shadow that disappears on "press" to provide tactile feedback.
- **Flashcards:** The centerpiece component. Features a pure white background, `rounded-xl` corners, and a centered Noto Serif character. Use a "paper-flip" animation transition.
- **Chips:** Soft Cherry Blossom Pink (#F8BBD0) with Deep Indigo text for category tags. Rounded-pill shape.
- **Input Fields:** Minimalist design with only a bottom border in Deep Indigo that thickens slightly on focus. The background is a very faint Indigo tint to define the hit area.
- **Progress Indicators:** Use a thin, elegant horizontal bar. The "filled" portion uses the Cherry Blossom Pink to signify growth and vitality.
- **Calligraphy Canvas:** A specialized component for stroke-order practice, using a faint grey grid pattern over the warm off-white paper background.