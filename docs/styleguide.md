# Style Guide — Web App (Paper-on-Dark, Yellow Accent)

This guide defines the **colors, typography, spacing, and layout rules** to keep the UI consistent.

---

## 1) Design Principles

### 1.1 Color usage (intentional)
- Use **neutrals for 90–95%** of the UI (paper + ink).
- Use **1 primary accent (Yellow)** for emphasis: key actions, highlights, active states.
- Use **1 secondary accent (Magenta/Red)** sparingly: progress/recording/alerts.
- Avoid “extra colors”. Increase clarity via **contrast, spacing, type scale** first.

### 1.2 Typography
- Clear hierarchy: **bold display headings**, readable body.
- Use a **ratio-based scale** (not random sizes).
- Tight tracking for large headings; comfortable line-height for paragraphs.

---

## 2) Color System

### 2.1 Core palette (tokens)

**Neutrals**
- `--bg-app`: #141414 (main dark background)
- `--bg-stars`: #1A1A1A (optional subtle star field layer)
- `--surface-paper`: #F2F2F0 (paper card surface)
- `--surface-paper-2`: #E9E9E6 (secondary paper surface / sections)
- `--surface-ink`: #111111 (dark bars / emphasis blocks)
- `--text-ink`: #111111 (primary text on paper)
- `--text-muted`: #3A3A3A (secondary text)
- `--stroke`: #D3D3CF (borders on paper)

**Accents**
- `--accent-yellow`: #FFD400 (primary highlight)
- `--accent-yellow-ink`: #1A1A1A (text on yellow)
- `--accent-danger`: #FF2D55 (progress/recording/critical)
- `--accent-pink-soft`: #FFB3C7 (grid overlay / helper visuals only)

**Effects**
- `--shadow-lg`: 0 16px 40px rgba(0,0,0,.25)

### 2.2 Usage rules
- **Primary button**: Yellow background + dark text.
- **Callout highlight**: Ink (black bar) background + yellow text.
- **Links**: Dark ink + underline on paper; Yellow on dark surfaces only.
- **Never use more than 2 accents on a single screen**.

### 2.3 CSS variables (drop-in)

```css
:root{
  --bg-app:#141414;
  --bg-stars:#1A1A1A;

  --surface-paper:#F2F2F0;
  --surface-paper-2:#E9E9E6;
  --surface-ink:#111111;

  --text-ink:#111111;
  --text-muted:#3A3A3A;
  --stroke:#D3D3CF;

  --accent-yellow:#FFD400;
  --accent-yellow-ink:#1A1A1A;
  --accent-danger:#FF2D55;
  --accent-pink-soft:#FFB3C7;

  --shadow-lg:0 16px 40px rgba(0,0,0,.25);

  --radius-xl:24px;
  --radius-lg:16px;
  --radius-md:12px;
}
```

---

## 3) Typography System

### 3.1 Font families (max 2 + mono)

* **Display / Headings**: `Inter Tight` (fallback: `Inter`, `system-ui`)
* **Body**: `Inter` (fallback: `system-ui`)
* **Mono (labels/callouts/code)**: `IBM Plex Mono` (fallback: `ui-monospace`)

### 3.2 Base sizing + scale (Major Third)

* Base paragraph: **16px**
* Scale ratio: **1.25**

Recommended sizes (rounded):

* `h1`: 49px
* `h2`: 39px
* `h3`: 31px
* `h4`: 25px
* `h5`: 20px
* `p`: 16px
* `small`: 13px

### 3.3 Line-height

* `p`: **150%** (readability)
* `h4`: **130%**
* `h2`: **110%**
* `h1`: **105%** default (use **110%** if multi-line, **100%** only for 1-line punch titles)

### 3.4 Letter-spacing (tracking)

Use `em` for web consistency:

* `p`: `0`
* small headings: `-0.005em` (≈ -0.5%)
* `h3`: `-0.015em` (≈ -1.5%)
* `h1`: `-0.02em` (≈ -2%)

### 3.5 Heading styling rules

* Headings are **uppercase**, heavy weight, optionally italic.
* Defaults:

  * `font-weight: 900`
  * `text-transform: uppercase`
  * `font-style: italic` (only for display headings)

### 3.6 Typography CSS (drop-in)

```css
html{ font-size:16px; }

body{
  font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  color:var(--text-ink);
  line-height:1.5; /* 150% */
}

h1,h2,h3,h4,h5{
  font-family:"Inter Tight",Inter,system-ui,sans-serif;
  text-transform:uppercase;
  font-style:italic;
  font-weight:900;
  margin:0;
}

h1{ font-size:3.0625rem; line-height:1.05; letter-spacing:-0.02em; } /* ~49px */
h2{ font-size:2.4375rem; line-height:1.10; letter-spacing:-0.015em; } /* ~39px */
h3{ font-size:1.9375rem; line-height:1.20; letter-spacing:-0.015em; } /* ~31px */
h4{ font-size:1.5625rem; line-height:1.30; letter-spacing:-0.005em; } /* ~25px */
h5{ font-size:1.25rem;   line-height:1.35; letter-spacing:-0.005em; } /* ~20px */

p{ font-size:1rem; line-height:1.5; letter-spacing:0; }

.small{ font-size:.8125rem; line-height:1.4; }

.mono{
  font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
}
```

---

## 4) Spacing System (8-Point Grid)

Use multiples of **8** for padding/margins and component sizing:

* 8, 16, 24, 32, 40, 48, 64, 96, 128, 256

Common spacing tokens:

* `xs`: 8
* `sm`: 16
* `md`: 24
* `lg`: 32
* `xl`: 64

---

## 5) Layout & Grid

### 5.1 Page structure

* Background: dark + subtle noise/stars
* Main content sits on a **paper card** centered

### 5.2 Column grid

* Desktop: **8 columns**
* Tablet: **8 columns**
* Mobile: **4 columns**
* Gutters: **16px** (mobile) / **24px** (tablet/desktop)
* Outer padding: **24px** (mobile) / **64px** (desktop)

### 5.3 Recommended container

* Max width: **1200px**
* Paper card radius: **24px**
* Paper card padding: **64px** desktop, **32px** mobile
* Shadow: `--shadow-lg`

---

## 6) UI Patterns

### 6.1 Callout bar (ink + yellow)

Use for: key tips, rules, warnings.

* Background: `--surface-ink`
* Text: `--accent-yellow`
* Font: `mono` or heading font
* Padding: 16–24
* Radius: 12–16

### 6.2 Highlight badge (yellow)

Use for: step numbers, emphasis markers.

* Background: `--accent-yellow`
* Text: `--accent-yellow-ink`
* Size: 32–40px circle for step numbers
* Weight: 800–900

### 6.3 “Rule” label style

* “RULE” in yellow rectangle on ink bar
* Large numerals can be stacked (e.g., 60 / 30 / 10)

---

## 7) Accessibility

* Text on paper must have strong contrast (dark ink on light surface).
* Yellow is **not** for paragraphs; use it for short highlights only.
* Minimum body text: **16px**.
* Recommended paragraph line length: **45–85 characters**.

---

## 8) Quick checklist (before shipping)

* [ ] Only 1 primary accent used (yellow) + 1 optional secondary accent
* [ ] Spacing uses multiples of 8
* [ ] Body text is 16px / 150% line-height
* [ ] Heading tracking is slightly tight (negative)
* [ ] Primary CTA is clearly dominant
* [ ] Callouts use ink bar + yellow text (not random colors)
