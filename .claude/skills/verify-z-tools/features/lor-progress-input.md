# LoR progress input

The player types the champion's total EXP exactly as the game shows it, plus a target level that defaults to 50 and a gemstone EXP bonus percent that defaults to 0%. The page works out the current level and the progress toward the next one. Totals above the max are capped with a visible warning, and the URL updates as the player types.

## Sub-features

- `input-exp` sets the champion's total EXP, accepts commas, and reformats on blur.
- `input-level-derived` shows `Level N, X / Y toward N+1.` under the field and `Current level` in the readout.
- `input-target` sets the target level, defaulting to 50.
- `input-clamp` caps totals above 552,670 with an amber hint and restores the capped value on blur.
- `input-bonus` sets the gemstone EXP bonus in whole percent. 100% doubles each run's EXP, and the hint states the resulting factor.
- `input-url` mirrors the inputs into `?exp=&target=&bonus=` so a reload or shared link restores them.

## How to get to it (user POV)

- Type into `Current EXP`, `Target level` and `Gemstone EXP bonus` on `/lor/xp`.
- Load `/lor/xp?exp=<n>&target=<n>&bonus=<n>`.

## Driving it with control.mjs

Preconditions: baseline, then `$V goto /lor/xp`.

- **Type a total.** Run `$V fill --label "Current EXP" --value 144,160 --commit`. The command reports that the field now shows `"144,160"`.
- **Derived level, totals, URL.** Run `$V snapshot --path lor-progress-input/typed.json`. `url` is `/lor/xp?exp=144160&target=50&bonus=0`. The `Current EXP` hint is `Level 38, 7,500 / 18,770 toward 39.` The totals are `XP to go` `408,510` and `Current level` `38`. Recompute: the sum of `xpToNext[0..36]` is 136,660, so 144,160 is 7,500 into level 38, and 552,670 minus 144,160 is 408,510.
- **Level boundary.** Run `$V fill --label "Current EXP" --value 51290`, then snapshot. The hint reads `Level 30, 0 / 5,850 toward 31.` At `51289` it reads `Level 29, 4,369 / 4,370 toward 30.`
- **Clamp over max.** Run `$V fill --label "Current EXP" --value 9999999`, then snapshot. The hint has `warn: true` and reads `The most a champion can hold is 552,670; using that.` With `--commit` the field shows `552,670`, and the strip shows the max-level message.
- **Gemstone bonus.** Run `$V goto "/lor/xp?exp=52290&target=50"`, then `$V fill --label "Gemstone EXP bonus" --value 100 --commit` and snapshot. The bonus hint reads `Each run earns 2× its base EXP.`, `url` ends `&bonus=100`, and `fewestRuns` reads `5, 3, 2, 2, 1, 1` runs. The `With Friends Like These...` row's `xp` is `23,940` with route text `base 11,970`. Recompute: 500,380 / (11,970 × 2 × m), rounded up. Set the bonus back to `0` and the strip returns to `9, 5, 3, 3, 2, 2`.
- **Reload keeps state.** Run `$V goto "/lor/xp?exp=5000&target=40"`, then snapshot. The input values are `5000` and `40`.
- **Proof.** Run `$V screenshot --path lor-progress-input/clamped.png --top` while the amber hint is showing.

## Gotchas

- `Target level` is `type=number`. Commas belong only in `Current EXP`.
- The `XP / run` column shows the bonus-raised EXP for one run at 1×, rounded down. Run counts round down once after the multiplier, so the column times the multiplier can differ from a run's EXP by under one per multiplier step.
- A capped value appears in the field only after blur. Use `--commit` when asserting the field's text, and leave it off when asserting the warning hint.
- The URL stores the raw digits typed, not the capped value. `?exp=9999999` stays in the URL while the page uses 552,670. That is current behavior, not a proof failure.
