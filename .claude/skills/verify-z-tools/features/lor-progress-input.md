# LoR progress input

The player enters exactly what the game shows: current level, XP earned toward the next level, and a target level that defaults to 50. Out-of-range input is capped with a visible warning instead of being rejected. The XP total and the URL update as the player types.

## Sub-features

- `input-level` sets the current level from 1 to 50.
- `input-xp` sets the XP into the current level, shows `/ <xp to next level>`, accepts commas, and reformats on blur.
- `input-target` sets the target level, defaulting to 50.
- `input-clamp` caps out-of-range values, shows an amber hint saying what was used, and restores the clamped value on blur.
- `input-url` mirrors the inputs into `?level=&xp=&target=` so a reload or shared link restores them.
- `input-maxlevel` disables the XP field at level 50 and shows `/ max`.

## How to get to it (user POV)

- Type into `Current level`, `XP into this level`, and `Target level` on `/lor/xp`.
- Load `/lor/xp?level=<n>&xp=<n>&target=<n>`.

## Driving it with control.mjs

Preconditions: baseline, then `$V goto /lor/xp`.

- **Type progress.** Run `$V fill --label "Current level" --value 38` and `$V fill --label "XP into this level" --value 7,500 --commit`. The second command reports that the field now shows `"7,500"`.
- **Totals and URL.** Run `$V snapshot --path lor-progress-input/typed.json`. `url` is `/lor/xp?level=38&xp=7500&target=50`, `XP to go` is `408,510`, `Earned so far` is `144,160`, and the XP field's `cap` is `/ 18,770`. Recompute: the sum of `xpToNext[0..36]` is 136,660, plus 7,500 is 144,160, and 552,670 minus that is 408,510.
- **Clamp over cap.** Run `$V fill --label "XP into this level" --value 99999`, then snapshot. The XP field's `warn` is `true` and its hint says `Level 38 holds at most 18,769 XP; using that.` Run `$V fill --label "XP into this level" --value 99999 --commit` and the field shows `18,769`.
- **Clamp level.** Run `$V fill --label "Current level" --value 70 --commit`. The field shows `50`, and the XP field is `disabled` with value `0`, cap `/ max`, `warn: false`, and hint `Max level reached.` Any XP typed earlier must not linger.
- **Reload keeps state.** Run `$V goto "/lor/xp?level=12&xp=500&target=40"`, then snapshot. The input values are `12`, `500`, `40`.
- **Proof.** Run `$V screenshot --path lor-progress-input/clamped.png --top` while the amber hint is showing.

## Gotchas

- The level fields are `type=number`. Typing `7,500` into them yields an empty field, so commas belong only in the XP field.
- A clamped value appears in the field only after blur. Use `--commit` when asserting the field's text, and leave it off when asserting the warning hint.
- The URL stores the raw digits typed, not the clamped value. `?xp=99999` stays in the URL while the page uses the cap. That is current behavior, not a proof failure.
