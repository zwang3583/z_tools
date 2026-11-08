# z-tools

Small utilities for video games. Each tool is one route, listed in the navbar from `src/tools/registry.ts`.

## Tools

- `/lor/xp`: Legends of Runeterra champion XP planner. Enter a champion's total EXP and any gemstone EXP bonus to see the fewest Path of Champions adventure runs to a target level at 5× to 30× XP.

## Develop

```sh
npm install
npm run dev
npm test
npm run build
```

## Adding a tool

Add an entry to `TOOLS` in `src/tools/registry.ts` with its path, game, title, summary, and the game's banner colours (`hue`). The navbar, home page, and banner read from that list.

## LoR data

`src/tools/lor-xp/data/*.json` is generated from the Legends of Runeterra wiki. Do not edit it by hand.

```sh
npm run sync:lor
```

The script exits non-zero if a wiki row fails to parse or the level table's running totals disagree with the wiki. Adventures with two routes store the longer route as `xp` and the shorter as `shortPathXp`.

## Deploy

The site is static (`dist/`). `public/_redirects` sends every path to `index.html` so deep links work on Netlify.
