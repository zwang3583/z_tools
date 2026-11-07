---
name: verify-z-tools
description: Drive the real z-tools web app (Vite + React SPA, including the Legends of Runeterra champion XP planner at /lor/xp) in headless Chrome to prove a change works the way a user sees it. Use after any change to src/, the LoR data JSON, styles, or routing, and whenever a claim about the UI, numbers, filters, or phone layout needs evidence.
---

# Verify z-tools

z-tools is a static single-page web app. Users touch it only through the browser. Each tool is one route listed in the navbar. Today there is `/` (the tool shelf) and `/lor/xp` (the LoR XP planner).

Other surfaces, not driven here: `npm test` runs the model unit tests, and `npm run sync:lor` regenerates `src/tools/lor-xp/data/*.json` from the live LoR wiki. That command makes network calls and rewrites tracked files, so run it only when the task is about the data.

All driving goes through one helper with no dependencies. It needs Node 22 or newer (for built-in `WebSocket`) and Google Chrome. Run it from the repo root:

```sh
V=.claude/skills/verify-z-tools/scripts/control.mjs
export VERIFY_RUN=my-task    # names this run; isolates ports, build, profile, artifacts
```

Every command reads `VERIFY_RUN`. Two runs with different names never share a port, build directory, Chrome profile, or artifact directory, so parallel agents are safe. Never drive a run you did not launch. The user's own `npm run dev` server is not a verification target.

## Launch

```sh
$V launch
```

This builds the current working tree with `tsc -b` and `vite build` into `.verify/runs/$VERIFY_RUN/dist`. It starts `vite preview` on a free port and headless Chrome with its own profile and DevTools port, then opens `/`. Ready means the line `READY http://127.0.0.1:<port> ...`. Before printing it, launch has already confirmed that the deep link `/lor/xp` serves the app shell and that Chrome's DevTools answers. A type error fails the launch, which is a real finding. Report it and do not route around it.

The app has no backend, database, auth, or seed data. All state lives in the URL query (`level`, `xp`, `target`) and in component state (filters, sort), and a fresh page load resets filters and sort.

Launch refuses if the run name is already live. Run cleanup first or pick another name.

## Doctor

```sh
$V doctor
```

Doctor is read-only. Every line must be `ok`:

- The preview and Chrome processes are alive.
- Each port is owned by this run's process group, not something else.
- The served bundle hash matches this run's build.
- `/lor/xp` serves the shell.
- The build was made from the current git `HEAD`. A dirty tree is noted.

Run doctor first whenever a result looks wrong. If `build matches git HEAD` fails, you committed or switched branches after launch, so clean up and launch again.

## Drive

Commands act on the single page in this run's Chrome. Each one reconnects, so they can be chained freely.

| Command | What the user does | Notes |
| --- | --- | --- |
| `$V goto <path>` | Types a URL or follows a link | `<path>` may include a query, e.g. `/lor/xp?level=30&xp=1000&target=50`. |
| `$V click --role <button\|link\|row> --name "<accessible name>" [--nth N]` | Clicks with the mouse | Real mouse events at the element's center after scrolling it into view. Fails if the name matches 0 visible elements, or more than 1 without `--nth`. |
| `$V fill --label "<label text>" --value "<text>" [--commit]` | Clicks a field, selects its contents, types | Real typing via `Input.insertText`. `--commit` presses Tab afterwards, which fires blur. Blur reformats the XP field and restores clamped values. `--value ""` clears the field. |
| `$V select --label Difficulty --option "Up to 5 stars"` | Picks a dropdown option | The one non-keyboard path: it sets the native `<select>` value and fires `change`, exactly what the browser does when an option is chosen. |
| `$V viewport 390 844` / `$V viewport desktop` | Uses a phone or a desktop | Applies to every later command in this run. Desktop is 1440x900. |
| `$V snapshot [--path rel.json] [--print]` | Reads the screen | Structured JSON of what is rendered: URL, nav, inputs (value, hint, warning), totals, the fewest-runs strip, empty messages, campaign chips, difficulty, sort, every table row (run cells ending in `*` are gold best cells), and `horizontalOverflow`. |
| `$V screenshot --path rel.png [--full] [--top]` | Looks at the screen | `--full` captures the whole page. `--top` scrolls to the top first; without it, the shot shows wherever the last click scrolled. |
| `$V eval "<js expression>"` | Not a user action | For reading state when snapshot lacks a field. Never use it to change state, since that bypasses the user path. |

Stable handles in this app:

- **Fields.** The labels are `Current level`, `XP into this level` and `Target level`.
- **Buttons.** The campaign chips are buttons named by campaign, e.g. `World Adventures` or `Nightmare Adventures`, and expose `aria-pressed`. The sort buttons are `Adventure`, `Stars` and `XP / run`.
- **Links.** The nav spine link is named `Legends of Runeterra Champion XP planner`, and the home link is `z-tools home`.

Per-feature recipes live in [features/README.md](features/README.md). Read the matching feature file before driving.

## Evidence

Artifacts go under `verify-artifacts/$VERIFY_RUN/`, which is gitignored, and survive cleanup. Name them by feature, e.g. `lor-progress-input/clamp.json`.

Proof standards:

- **Drive the user path.** Type into fields, click chips, and load URLs a user could load. Do not call component internals or set React state.
- **Capture both sides.** Record the action and the resulting state: a snapshot before and after, or the command output plus a snapshot.
- **Check the numbers.** For a numeric claim, recompute it independently from `src/tools/lor-xp/data/*.json` and compare it with the snapshot. Do not compare the UI with `model.ts`, because that is the code under test. Total XP to reach level L is the sum of `levels.json` `xpToNext[0..L-2]`. Runs are `ceil(remaining / (adventure.xp × multiplier))`.
- **Verify side effects.** The only one is the URL query, which is read back from `snapshot.url`.
- **Cover phone width.** For layout claims, take a screenshot at 390 wide and check `horizontalOverflow: false`.

## Cleanup

```sh
$V cleanup
```

Cleanup stops only the process groups this run started, using the recorded pids, never by process name. It copies `preview.log` and `chrome.log` into `verify-artifacts/$VERIFY_RUN/logs/` and deletes `.verify/runs/$VERIFY_RUN`. Evidence stays. Run it after every run, including failed ones. Delete `verify-artifacts/$VERIFY_RUN` yourself only when the evidence is no longer needed.

## Helpers

- `scripts/control.mjs` is executable. The command table above is its complete interface. Running `$V` with no arguments prints usage.
