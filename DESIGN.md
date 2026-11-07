---
name: z-tools
description: Small, correct utilities for the games you play, shelved like game cases.
colors:
  case-charcoal: "#101216"
  panel: "#171a20"
  panel-raised: "#1e222a"
  hairline: "#2b303a"
  hairline-strong: "#3a404c"
  text: "#eceef2"
  text-muted: "#a9b0bc"
  text-faint: "#8a92a0"
  warn-amber: "#f0b45a"
  focus-blue: "#8fb8ff"
  shell-band: "#262b34"
  lor-band-navy: "#0B1A33"
  lor-ink-parchment: "#E9D8A6"
  lor-accent-hextech-gold: "#C8AA6E"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.5
  spine:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.02em"
  figure:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    fontFeature: "tnum"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: "6px"
  pill: "999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.5rem"
  "6": "2rem"
  "7": "3rem"
components:
  spine-tab:
    backgroundColor: "{colors.shell-band}"
    textColor: "{colors.text-muted}"
    typography: "{typography.spine}"
    padding: "0.5rem 1rem"
  spine-tab-active:
    backgroundColor: "{colors.lor-band-navy}"
    textColor: "{colors.lor-ink-parchment}"
  banner:
    backgroundColor: "{colors.lor-band-navy}"
    textColor: "{colors.lor-ink-parchment}"
    typography: "{typography.display}"
    padding: "1.5rem 2rem"
  input-number:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text}"
    typography: "{typography.figure}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.text-faint}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
    height: "2.25rem"
  chip-pressed:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text}"
  select:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
  ruled-panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: "1rem"
  table-head:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    padding: "0.5rem 0.75rem"
---

# Design System: z-tools

## Overview

**Creative North Star: "The Game-Case Shelf"**

z-tools is a shelf of game cases, not a SaaS dashboard. The shell is case-plastic charcoal with a cooler panel layer and hairline rules; it carries no hue of its own. Color arrives only with a game: each game owns one spine hue triple (band, ink, accent), the way a platform owns the band on a box spine. The active tool's spine tab in the navbar continues down into the page as its banner, so tab and header read as one spine in the game's hue.

Density is that of a working instrument. Inputs sit in one compact row, the answer sits directly under them, and detail lives in a hairline-ruled table with tabular figures right-aligned in strict columns. No card inflation, no decorative gradients, no illustration. The game's accent is functional: it marks the answer (fewest runs, XP to go) and the active state, never ornament.

Adding a game means adding a hue to the registry, never new chrome.

**Key Characteristics:**
- Neutral charcoal shell; all chroma comes from per-game hue triples.
- Navbar is a row of spines; the active spine extends into the page as a banner.
- Barlow for UI and data; Barlow Condensed semibold uppercase only for spine voice.
- Tabular figures everywhere; numbers right-aligned in ruled columns.
- Flat surfaces separated by 1px hairlines, not shadows.

## Colors

A cool near-black neutral ramp that stays silent, plus one hue triple per game injected as `--band`, `--band-ink`, and `--accent`.

### Primary
- **Hextech Gold** (lor-accent-hextech-gold): the Legends of Runeterra accent. Marks the answer (fewest-runs figures, "XP to go", best cells in the table), the spine top border, star glyphs, the pressed-chip check and the active sort arrow.

### Secondary
- **Deep Runeterra Navy** (lor-band-navy): the LoR band. Fills the active spine tab, the tool banner, and the vertical band on the home shelf card.
- **Parchment Ink** (lor-ink-parchment): text set on the LoR band.

### Neutral
- **Case Charcoal** (case-charcoal): page ground.
- **Panel** (panel): topbar, shelf cards, the fewest-runs strip, table body.
- **Panel Raised** (panel-raised): inputs, selects, pressed chips, table header, row hover.
- **Hairline** (hairline): every divider, panel border and table rule.
- **Hairline Strong** (hairline-strong): input, select and chip strokes; dashed empty-state border.
- **Text / Text Muted / Text Faint** (text, text-muted, text-faint): primary copy; labels, notes and secondary figures; hints, meta lines, captions, footer.
- **Shell Band** (shell-band): the neutral fallback band when no game hue is in scope.
- **Warn Amber** (warn-amber): clamp warnings on input hints only.
- **Focus Blue** (focus-blue): 2px focus outline, deliberately outside every game hue so focus reads the same on every shelf.

### Named Rules
**The Spine Hue Rule.** Each game owns exactly one hue triple `{ band, ink, accent }`, declared on its entry in `src/tools/registry.ts` and applied as `--band`, `--band-ink`, `--accent` on that game's spine, shelf card and tool route. The shell never hard-codes a game color. A new game adds a registry hue; it never adds new chrome, layouts or component variants.

**The Accent Marks the Answer Rule.** Inside a tool, the game accent is reserved for the result the player came for (fewest runs, remaining XP, best cells) and for active/selected state. It is never a background wash or decoration; the strongest tint allowed is an 18% mix behind a best cell.

**The Neutral Shell Rule.** Charcoal, panel and hairline carry the shell. Warn amber and focus blue are the only non-game hues, and each has one job.

## Typography

**Display Font:** Barlow Condensed 600 (with Barlow, system-ui)
**Body Font:** Barlow 400/500/600 (with system-ui)

**Character:** Barlow is a plain, sturdy grotesque that holds tabular figures well; its condensed cut, set uppercase, is the printed spine of a game case.

Scale (rem): 0.8125, 0.9375 (base), 1.0625, 1.25, 1.5, 2. `font-variant-numeric: tabular-nums` is set on body and inherited everywhere.

### Hierarchy
- **Display** (Barlow Condensed 600, 2rem, line-height 1, uppercase, 0.01em): tool banner title only; drops to 1.5rem under 36rem.
- **Headline** (Barlow 600, 2rem, 1.15): home page title.
- **Title** (Barlow 600, 1.25rem): section heads ("Fewest runs", "Every adventure").
- **Spine** (Barlow Condensed 600, 1.0625rem, 1.1, uppercase, 0.02em): spine tab titles; also the wordmark (1.25rem), shelf card titles (1.5rem), the shelf band (0.8125rem, 0.06em), and multiplier labels (5x to 30x, 0.04em, not uppercased).
- **Figure** (Barlow 500/600, 1.5rem to 2rem): input values, totals, fewest-runs counts.
- **Body** (Barlow 400, 0.9375rem, 1.5): copy and table cells; prose capped at 60 to 75ch.
- **Label** (Barlow 500, 0.8125rem): table headers, chips, hints and meta lines (hints and meta at 400).

### Named Rules
**The Spine Voice Rule.** Barlow Condensed uppercase is reserved for spine voice: the wordmark, spine and banner titles, shelf titles and bands, and multiplier labels. Body copy, labels, and data never use it.

**The Tabular Rule.** Every number is tabular and, in tables, right-aligned in its own column.

## Layout

Single centered column, max 76rem, side gutter `clamp(1rem, 3vw, 2rem)`. Page padding 2rem top, 3rem bottom. Spacing follows a 0.25rem-based scale (spacing tokens 1 to 7); sections are separated by 2rem padding and a hairline rule rather than by cards.

Tool pages run top to bottom: spine navbar (min 3.5rem), game banner, one compact input row (three fixed 12rem fields plus right-aligned totals), the six-cell answer strip, then filters and the full table. Breakpoints: at 60rem the inputs go three-up with totals wrapping below and the strip becomes 3x2; at 36rem the inputs go two-up, the strip 2x3, the table min-width drops to 34rem with a sticky first column and stars folded into the campaign line. Wide tables scroll horizontally inside their bordered wrapper; the page itself never scrolls sideways.

The home page is a shelf: an auto-fill grid of cards, min 18rem each, 1rem gap.

## Elevation & Depth

Flat. There are no drop shadows. Depth is tonal: charcoal ground, panel, raised panel, separated by 1px hairlines. The topbar's bottom edge is an inset 1px hairline (`box-shadow: inset 0 -1px` hairline), which is a rule, not elevation. The banner's bottom edge is a 1px line mixing 40% accent into the band.

### Named Rules
**The Hairline Rule.** Separate with a 1px hairline or a tonal step, never a shadow. Hover raises tone (panel to panel-raised, or border to accent), not position.

## Shapes

One gentle radius (6px) on every container, input, select and table wrapper. Chips are full pills (999px). Spine tabs and banners are square-cornered bands; the spine tab carries a 3px accent top border like the colored edge of a case spine. The home shelf card carries a vertical band of the game hue with rotated condensed text along its left edge.

## Components

### Spine Tabs (Navigation)
The signature. A row of spines in the topbar, each styled by its game's hue triple.
- **Rest:** 3px accent top border; background a 55% mix of band into panel; text muted. A small game-name line in accent sits above the condensed uppercase tool title.
- **Hover:** background 85% band mix; text full. 180ms with the shared ease.
- **Active:** solid band, band-ink text; continues visually into the banner below.
- **Mobile:** the nav scrolls horizontally; the wordmark never shrinks.

### Banner
Full-bleed band in the game's hue under the navbar: condensed uppercase title left, game name in accent right, wrapping on narrow screens.

### Shelf Card
Panel card, hairline border, 6px radius, min height 9rem, vertical band of the game hue on the left. Hover turns the border to the accent.

### Inputs / Fields
- **Style:** raised-panel fill, hairline-strong stroke, 6px radius, large 500-weight tabular figures (1.5rem; 1.25rem on phones). An inline suffix such as "/ 5,850" sits inside the field in faint text.
- **Hover:** stroke lightens to text-faint.
- **Focus:** 2px focus-blue outline at 0 offset, stroke cleared.
- **Disabled:** faint text, not-allowed cursor. Hints under fields in label size, faint; warn amber when a value is clamped.

### Chips (filters)
- **Style:** transparent pill, hairline-strong stroke, faint label text, min height 2.25rem.
- **Pressed:** raised-panel fill, full text, stroke 55% accent; an inline SVG check fades in, stroked in accent.

### Select
Same fill, stroke, radius and focus as inputs, at 2.25rem height and body size.

### Answer Strip
A single bordered panel divided into six cells by hairlines (3x2 and 2x3 at the breakpoints). Each cell: multiplier label in spine voice, run count large in accent with "runs" in muted body, adventure name, then a faint meta line.

### Data Table
Inside a bordered, horizontally scrolling panel. Sticky raised header in muted label text with sort buttons (inline SVG chevron, 35% opacity at rest, accent and full opacity when active, rotated for ascending). Rows ruled by hairlines; row hover raises tone. Numeric columns right-aligned. Best cells: accent text, 600 weight, 18% accent wash. Secondary lines (campaign, route note) in faint label size beneath the primary value.

### Empty State
Dashed hairline-strong border, 6px radius, muted text with a concrete next action.

## Do's and Don'ts

### Do:
- **Do** give every new game a `{ band, ink, accent }` triple in `src/tools/registry.ts` and let `--band`, `--band-ink`, `--accent` style its spine, shelf card and banner.
- **Do** check each new hue triple for AA contrast: ink on band, accent on band, and accent on panel.
- **Do** keep the accent on the answer and on selected state only.
- **Do** separate regions with 1px hairlines and tonal steps.
- **Do** set every number in tabular figures and right-align numeric columns.
- **Do** use inline SVG for icons (star, check, sort chevron), sized 0.625 to 0.75rem and colored by currentColor or the accent.
- **Do** keep transitions to color, background, border and opacity at 150 to 180ms on `cubic-bezier(0.16, 1, 0.3, 1)`, zeroed under reduced motion.

### Don't:
- **Don't** add per-game chrome, layouts or component variants; a new game is a new hue, nothing more.
- **Don't** hard-code a game's color in the shell or in shared components.
- **Don't** use drop shadows for depth.
- **Don't** set body copy, labels or data in Barlow Condensed.
- **Don't** wrap sections in cards to separate them; the table and strip are the only bordered panels on a tool page.
