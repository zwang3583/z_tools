# LoR adventure table

The table lists every adventure with its campaign, stars, XP per run, and the runs needed at each multiplier, and marks the fewest in each column in gold. The player can sort it and narrow it by campaign and maximum difficulty. On a phone it scrolls sideways with the adventure name pinned.

## Sub-features

- `table-runs` shows run counts per multiplier for all 55 adventures, with gold `*` cells at each column's minimum.
- `table-route` labels adventures with two routes `long route · short N` and counts the long route.
- `table-sort` sorts by `Adventure`, `Stars`, or `XP / run`. A second click reverses the order, and the header exposes `aria-sort`.
- `table-campaigns` toggles each campaign chip (`aria-pressed`) to hide or show its adventures.
- `table-difficulty` uses the `Difficulty` select (`Any`, `Up to N stars`) to hide harder adventures.
- `table-empty` explains when the filters leave nothing.
- `table-phone` keeps the name column pinned at 390 wide, folds stars into the name line, and never overflows the page.

## How to get to it (user POV)

- Scroll below the fewest-runs strip on `/lor/xp`.

## Driving it with control.mjs

Preconditions: baseline, then `$V goto "/lor/xp?exp=52290&target=50"`.

- **Full table.** Run `$V snapshot --path lor-adventure-table/all.json`. `rows` has 55 entries. Row 0 is `With Friends Like These...` with runs `9*,5*,3*,3*,2*,2*`. `The Frost Witch` has `xp` `5,925` and `route` `long route · short 4,360`.
- **Sort.** Run `$V click --role button --name "Stars"`, then snapshot. `sort` is `["Stars descending"]` and row 0 is the 10-star adventure. Click `Stars` again and `sort` is `["Stars ascending"]` with `The Swift Scout` (0 stars) first.
- **Campaign chip.** Run `$V click --role button --name "World Adventures"`, then snapshot. That chip has `on: false`, and no row has campaign `World Adventures`. Clicking again restores it.
- **Difficulty.** Run `$V select --label Difficulty --option "Up to 5 stars"`, then snapshot. Every row's `stars` is at most 5, and the 5× column has two gold cells, `The Ruined King` and `The Frost Witch`, at `17` each.
- **Empty state.** Click each of the seven campaign chips off, then snapshot. `rows` is empty and `emptyMessages` includes `No adventures match these filters. Turn a campaign back on or raise the difficulty.`
- **Phone.** Run `$V viewport 390 844`, `$V goto "/lor/xp?exp=52290&target=50"`, then `$V snapshot --path lor-adventure-table/phone.json`. `horizontalOverflow` is `false`. Run `$V eval "(() => { const w = document.querySelector('.table-wrap'); w.scrollIntoView(); w.scrollLeft = w.scrollWidth; return w.scrollLeft > 0 })()"` and `$V screenshot --path lor-adventure-table/phone-scrolled.png`. The adventure names stay pinned on the left beside the 10× to 30× columns. Finish with `$V viewport desktop`.
- **Proof.** Run `$V screenshot --path lor-adventure-table/table.png --full` at desktop.

## Gotchas

- Several names repeat across campaigns with different XP, such as `The Star Forger` (World 4,505 and Arcane 10,670) and `The Ancient Fear`. Match rows on name plus campaign.
- Filters and sort are not in the URL, so any `goto` resets them.
- The `eval` scroll in the phone step only positions the view for a screenshot. Users scroll the wrapper with touch, and the wrapper has `tabIndex=0` for keyboard scrolling.
- `Difficulty` options are built from the star values present in the data, starting at 2. An adventure added at a new star level adds an option.
