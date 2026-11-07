# z-tools verification map

This directory is the maintained source for verifying z-tools as a user sees it. Read this index, then use the matching feature file as the recipe. Commands use `$V`, the helper defined in `../SKILL.md`.

## Baseline preconditions

- `export VERIFY_RUN=<task-name>`, then `$V launch` printed `READY`.
- `$V doctor` prints only `ok` lines.
- The viewport is desktop (1440x900) unless a recipe says otherwise.
- There is no seed data. All state comes from the URL query and page interaction, and each `goto` starts clean apart from the query.

## Driving conventions

- Start every recipe with `$V goto <path>` so filters and sort are at their defaults: all campaigns on, difficulty `Any`, sorted by `XP / run` descending.
- Address controls by label or accessible name, as listed in each file. Never use coordinates.
- Treat every quoted name as literal, including the three-dot ellipsis in `With Friends Like These...`.
- Recompute expected numbers from `src/tools/lor-xp/data/levels.json` and `adventures.json`, never from `model.ts`.

## Proof and skip reporting

- Save a snapshot JSON for every state you assert on, under `verify-artifacts/$VERIFY_RUN/<feature-id>/`.
- Add a screenshot for any visual or layout claim, with `--top` or `--full` so its framing is deliberate.
- Record which entry point you used (URL query, typing, chip, sort header) next to each artifact.
- If an entry point cannot be reached, report the command you tried and the unmet precondition. Never count a different path as verifying it.

## Feature entry contract

Each feature file starts with an H1 and one paragraph on the user-visible behavior, followed by exactly four H2s in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with control.mjs`, `Gotchas`.

## Features

- [Tool navigation](./tool-navigation.md) covers the navbar spine, the home shelf, deep links, and unknown routes.
- [LoR progress input](./lor-progress-input.md) covers level, partial XP and target entry, clamping, formatting, and URL persistence.
- [LoR fewest runs](./lor-fewest-runs.md) covers the per-multiplier answer strip, ties, and the at-target and max-level states.
- [LoR adventure table](./lor-adventure-table.md) covers run counts, gold best cells, sorting, campaign and difficulty filters, the empty state, and phone layout.
