# Tool navigation

Every tool is reachable from a navbar spine and from the home shelf. Each tool's page opens with a banner in its game's color, and any deep link or unknown path lands on a working page instead of an error.

## Sub-features

- `nav-spine` shows one navbar link per tool, with the current tool marked.
- `nav-home` lists every tool as a shelf card at `/`.
- `nav-deeplink` serves a tool route loaded directly by URL, including a query.
- `nav-unknown` redirects any unknown path to `/`.

## How to get to it (user POV)

- Click the `z-tools home` wordmark, or load `/`.
- Click the tool's spine in the navbar.
- Click a shelf card on the home page.
- Paste a tool URL, e.g. `/lor/xp?exp=52290&target=50`.

## Driving it with control.mjs

Preconditions: baseline.

- **Home lists tools.** Run `$V goto /` then `$V snapshot --path tool-navigation/home.json`. `h1` is `Utilities for the games you play`, and `shelf` has one entry per tool with `href` `/lor/xp`.
- **Shelf card opens the tool.** Run `$V click --role link --name "Legends of Runeterra Champion XP planner Fewest Path of Champions runs to level a champion, from your exact XP."`. The card's name includes its summary. The output ends `-> /lor/xp`.
- **Spine marks the current tool.** Run `$V snapshot --path tool-navigation/tool.json`. `nav[0].current` is `true`, and `banner` is `{ "title": "Champion XP planner", "game": "Legends of Runeterra" }`.
- **Wordmark returns home.** Run `$V click --role link --name "z-tools home"`. The output ends `-> /`, and a new snapshot shows `nav[0].current` as `false`.
- **Deep link.** Run `$V goto "/lor/xp?exp=52290&target=50"`. The output `at /lor/xp?exp=52290&target=50` and a snapshot with input values `52290` and `50` prove the route and query survived a direct load.
- **Unknown route.** Run `$V goto /does-not-exist`. The output is `at /`.
- **Proof.** Run `$V screenshot --path tool-navigation/tool.png --top` on `/lor/xp`. The tab and the navy banner read as one continuous band.

## Gotchas

- The spine link is named `Legends of Runeterra Champion XP planner`. The shelf card's name adds the tool summary, so a recipe that passes the spine's name on `/` clicks the spine, not the card.
- `vite preview` falls back to `index.html` the same way `public/_redirects` does on Netlify, but a deep link passing here does not prove the deployed redirect. To check production, `curl -s -o /dev/null -w "%{http_code}" https://z-tools-hub.netlify.app/lor/xp` must print `200`.
