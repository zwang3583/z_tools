---
version: 1
slug: "src-tools-lor-xp-lorxppage-tsx"
primary_target: "src/tools/lor-xp/LorXpPage.tsx"
related_targets: ["src/App.tsx"]
---

# Surface: LoR champion XP planner (/lor/xp) and the z-tools shell

Mode: Operate. Audience: Path of Champions players planning a grind, glancing between the game client and this page. Task: enter level + XP progress, read the fewest runs per XP multiplier, then scan every adventure. Constraints: wiki-sourced data, AA contrast, keyboard, phone width. Decisions open: none blocking; owner delegated all choices.

## Direction contract
FORM: game-case shelf — each tool's game owns a spine banner hue (seed:de21eddc4cd0e215, assigned candidate 5).
THESIS: A shelf of game cases, not a SaaS dashboard. Every game gets one banner hue the way a platform owns its spine band; the shell stays neutral so a second game slots in by adding a hue. Refuses the grey card grid with one accent.
OWN-WORLD: Case-plastic charcoal ground with a cooler panel layer, hairline rules. Barlow for UI and tabular data, Barlow Condensed semibold for spine voice only: spine and banner titles, the wordmark, and multiplier labels (5× to 30×). LoR banner: hextech gold on deep navy. Gold also marks "fewest runs".
FIRST VIEWPORT: Top navbar = row of spines (game band + tool name). Below, the LoR banner header carrying game + tool name. Inputs (level, XP into level with "/ max", target) in one compact row; immediately under it the fewest-runs strip: six multiplier columns, each runs count + adventure name. Then the full adventure table.
STORY: Player types what the game shows, sees the answer in the strip without scrolling, then the table explains alternatives and ties.
SIGNATURE: The active tool's spine extends down into the page as its banner, so the navbar tab and header read as one case spine in the game's hue.
RAISES: from gate board — table rows keep identity and re-sort in place; changed best cells hold gold. From high-density web — hairline-ruled dense table, no card inflation. From datamatics — tabular figures right-aligned in strict columns. From acetate manual — one hue per division, never decorative.
