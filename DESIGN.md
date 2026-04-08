# MakanJe Design Framework

> Shared design system for MakanJe and related apps. Copy this file into any project that should match the MakanJe visual language.

---

## Philosophy

**Notion clarity + Apple UX polish.** Clean, content-first interfaces. No ornament for its own sake. Every element earns its space.

---

## Colors

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| Canvas | `#ffffff` | Primary background |
| Surface | `#f5f5f7` | Cards, inputs, stat blocks |
| Surface Elevated | `#ffffff` | Modals, sheets, elevated cards |
| Text Primary | `#1d1d1f` | Headings, body text |
| Text Secondary | `rgba(0,0,0,0.48)` | Labels, metadata |
| Text Tertiary | `rgba(0,0,0,0.24)` | Placeholders, disabled text |
| Accent | `#0071e3` | Links, CTAs, active nav (Apple Blue) |
| Border | `rgba(0,0,0,0.08)` | Whisper-thin card/section borders |
| Divider | `rgba(0,0,0,0.04)` | List row separators |
| Success | `#10B981` | Checked items, confirmations |
| Error | `#EF4444` | Validation, destructive actions |

### Dark Mode

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| Canvas | `#ffffff` | `#000000` | Pure black (OLED-friendly, Apple-style) |
| Surface | `#f5f5f7` | `#1c1c1e` | |
| Surface Elevated | `#ffffff` | `#2c2c2e` | |
| Text Primary | `#1d1d1f` | `#f5f5f7` | |
| Text Secondary | `rgba(0,0,0,0.48)` | `rgba(255,255,255,0.48)` | |
| Text Tertiary | `rgba(0,0,0,0.24)` | `rgba(255,255,255,0.24)` | |
| Accent | `#0071e3` | `#2997ff` | Brighter blue on dark backgrounds |
| Border | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | |
| Divider | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.04)` | |
| Nav Glass | `rgba(255,255,255,0.72)` | `rgba(0,0,0,0.72)` | Backdrop blur nav |
| Nav Border | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` | |

### Semantic Colors (Same in Both Modes)

| Token | Value | Usage |
|-------|-------|-------|
| Breakfast | `#F59E0B` | Amber — morning slot indicators |
| Lunch | `#10B981` | Green — midday slot indicators |
| Dinner | `#8B5CF6` | Purple — evening slot indicators |

---

## Typography

**Font:** [Inter](https://fonts.google.com/specimen/Inter) — weights 400, 500, 600, 700

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

| Role | Size | Weight | Tracking | Usage |
|------|------|--------|----------|-------|
| Page Title | 28px | 700 | -0.5px | Top-level headings ("Dishes", "Shopping") |
| Section Title | 15–17px | 700 | -0.2px | Date headings, section labels |
| Body | 14–15px | 500–600 | normal | Dish names, item names |
| Caption | 11–12px | 500–600 | 0.2–0.8px | Slot labels, group headers, metadata |
| Micro | 10px | 600 | 0.5px | Badges, pill labels, tag text |

---

## Spacing

Use a 4px base grid. Common values:

| Use | Value |
|-----|-------|
| Inner padding (small) | 8px / 12px |
| Card padding | 16px |
| Page horizontal padding | 20px |
| Section gap | 24px |
| Between cards | 8px / 12px |

---

## Border Radius

| Size | Value | Usage |
|------|-------|-------|
| Small | 6px | Buttons, inputs |
| Medium | 8px | Cards, dish pills |
| Large | 10px | Search inputs |
| XL | 12px | Stat blocks, modals, sections |
| XXL | 16px | Cooking mode step card |
| Pill | 980px | CTAs, tags, filters (Apple signature) |
| Circle | 50% | Avatars, dots |

---

## Shadows

| Usage | Value |
|-------|-------|
| Cards (sparingly) | `rgba(0,0,0,0.22) 3px 5px 30px 0px` |
| Most surfaces | None — rely on background color contrast |

---

## Components

### Buttons

| Variant | Background | Text | Radius |
|---------|-----------|------|--------|
| Primary | `#0071e3` (Accent) | `#ffffff` | 980px (pill) |
| Secondary | `#f5f5f7` (Surface) | `#1d1d1f` (Text Primary) | 980px |
| Ghost | transparent | `#0071e3` (Accent) | 980px |
| Destructive | `#EF4444` (Error) | `#ffffff` | 980px |

### Bottom Navigation

- Glass effect: `background: var(--nav-glass)` + `backdrop-filter: blur(20px)`
- Border: `1px solid var(--nav-border)` on top
- 5 tabs with emoji icons
- Active state: Accent color text, inactive: Text Tertiary
- Safe area padding for notched devices

### Inputs

- Background: Surface (`#f5f5f7`)
- Border: none (or 1px Border on focus)
- Border radius: 6–10px
- Font size: 16px minimum (prevents iOS zoom)
- Focus ring: 2px accent-colored ring

### Cards / Sections

- Background: Surface
- Border: none (or 1px Border)
- Border radius: 12px
- Padding: 16px
- No shadow by default

---

## Dark Mode Implementation

### CSS Custom Properties

```css
:root {
  --canvas: #ffffff;
  --surface: #f5f5f7;
  --surface-elevated: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: rgba(0,0,0,0.48);
  --text-tertiary: rgba(0,0,0,0.24);
  --accent: #0071e3;
  --border: rgba(0,0,0,0.08);
  --divider: rgba(0,0,0,0.04);
  --nav-glass: rgba(255,255,255,0.72);
  --nav-border: rgba(0,0,0,0.06);
}

/* System preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --canvas: #000000;
    --surface: #1c1c1e;
    --surface-elevated: #2c2c2e;
    --text-primary: #f5f5f7;
    --text-secondary: rgba(255,255,255,0.48);
    --text-tertiary: rgba(255,255,255,0.24);
    --accent: #2997ff;
    --border: rgba(255,255,255,0.08);
    --divider: rgba(255,255,255,0.04);
    --nav-glass: rgba(0,0,0,0.72);
    --nav-border: rgba(255,255,255,0.06);
  }
}

/* Manual override */
[data-theme="dark"] {
  --canvas: #000000;
  --surface: #1c1c1e;
  /* ... same dark values ... */
}
```

### Toggle Logic

```ts
// Read preference
const theme = localStorage.getItem('theme') // 'light' | 'dark' | null (system)

// Set preference
localStorage.setItem('theme', 'dark')
document.documentElement.setAttribute('data-theme', 'dark')

// Clear to system
localStorage.removeItem('theme')
document.documentElement.removeAttribute('data-theme')
```

### Flash Prevention

Add this inline script in `<head>` before any CSS loads:

```html
<script>
  (function() {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  })();
</script>
```

---

## Tailwind Config

```ts
theme: {
  extend: {
    colors: {
      canvas: "var(--canvas)",
      surface: "var(--surface)",
      "surface-elevated": "var(--surface-elevated)",
      "text-primary": "var(--text-primary)",
      "text-secondary": "var(--text-secondary)",
      "text-tertiary": "var(--text-tertiary)",
      accent: "var(--accent)",
      border: "var(--border)",
      divider: "var(--divider)",
      breakfast: "#F59E0B",
      lunch: "#10B981",
      dinner: "#8B5CF6",
      success: "#10B981",
      error: "#EF4444",
    },
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    },
    borderRadius: {
      pill: "980px",
    },
  },
}
```

---

## Usage in Other Apps

1. Copy this file into the project root
2. Import Inter from Google Fonts
3. Set up the CSS custom properties from the Dark Mode section
4. Reference tokens by name (`var(--accent)`, `bg-surface`, `text-text-primary`)
5. Follow the typography scale and spacing grid
6. Use pill radius for CTAs and tags
7. Use glass effect for persistent navigation bars
