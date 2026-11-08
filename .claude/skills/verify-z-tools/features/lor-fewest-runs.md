# LoR fewest runs

The strip under the inputs answers the main question. For each multiplier from 5× to 30×, it shows the fewest runs any listed adventure needs to reach the target, which adventure that is, and whether others tie. When nothing is left to earn, it says why instead.

## Sub-features

- `best-cell` shows, per multiplier, the run count, the adventure name, and its campaign.
- `best-tie` names the tying adventure when exactly two tie, and shows `Tied with N others` beyond that.
- `best-filtered` recomputes the strip from only the campaigns and difficulties left switched on.
- `best-at-target` shows `Already at level N. Raise the target level to plan more runs.` when the target is at or below the current level.
- `best-max` shows `Level 50 is the max. This champion has nothing left to earn.` at level 50.

## How to get to it (user POV)

- Open `/lor/xp` and enter progress. The strip sits directly under the inputs.

## Driving it with control.mjs

Preconditions: baseline.

- **Answer per multiplier.** Run `$V goto "/lor/xp?exp=52290&target=50"` then `$V snapshot --path lor-fewest-runs/l30.json`. `fewestRuns` lists `7 runs`, `4 runs`, `3 runs`, `2 runs`, `2 runs`, `2 runs`, all for `With Friends Like These...`. The 15×, 25× and 30× cells read `Tied with The Star Forger`. Recompute: 500,380 remaining divided by 11,970 × (1 + m), rounded up. For example 5× is 500,380 / 71,820 = 6.97, so 7.
- **Filters change the answer.** Run `$V click --role button --name "Nightmare Adventures"` then `$V snapshot --path lor-fewest-runs/no-nightmare.json`. Every cell now names `The Star Forger`, with runs `8, 5, 3, 3, 2, 2`.
- **At target.** Run `$V goto "/lor/xp?exp=176530&target=40"` then snapshot. `fewestRuns` is empty, and `emptyMessages[0]` is `Already at level 40. Raise the target level to plan more runs.`
- **Max level.** Run `$V goto "/lor/xp?exp=552670&target=50"` then snapshot. `emptyMessages[0]` is `Level 50 is the max. This champion has nothing left to earn.`
- **Proof.** Run `$V screenshot --path lor-fewest-runs/strip.png --top` at desktop, then `$V viewport 390 844` and `$V screenshot --path lor-fewest-runs/strip-phone.png --top`. On the phone shot, the first row of the strip is fully visible without scrolling. Finish with `$V viewport desktop`.

## Gotchas

- `With Friends Like These...` is the real adventure name, ellipsis included, not truncated text.
- Gold run numbers in the strip are the answer. Gold cells in the table are a separate feature, `lor-adventure-table`.
- Turning off every campaign empties the table, and the strip then reads `No adventures selected` in each cell. That is expected, not a crash.
