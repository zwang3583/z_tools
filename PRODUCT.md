# Product

<!-- impeccable:product-schema 1 -->

> Interview skipped at the owner's instruction ("do not consult me for anything"). Facts below come from the owner's written brief; lines marked *(inferred)* are assumptions to confirm later.

## Platform

web

## Stack

delegated: Vite + React + TypeScript, static build, hosted on Netlify at z-tools.netlify.app. Chosen because each utility is an interactive calculator with shared shell chrome, and a static SPA deploys free on Netlify with no server.

## Users

Players of several video games who want a fast, correct answer to a grinding or planning question while they play. The first audience is Legends of Runeterra Path of Champions players planning how many adventures to run to level a champion. *(inferred)* They often have the game open on another screen or device and glance between it and the tool.

## Product Purpose

z-tools hosts a growing set of small video game utilities. Each utility is its own page reachable from a shared navbar. Success means a player gets a trustworthy number in seconds, without reading instructions.

## Positioning

Correctness first: game data is sourced from the community wiki with a reproducible sync script, and calculations accept the exact state the player sees in game (for LoR, a level plus partial XP progress), not a rounded approximation.

## Operating Context

- LoR Path of Champions shows a champion's level and XP progress toward the next level. Adventures award fixed champion XP on completion, multiplied by an XP bonus the owner names as 5×, 10×, 15×, 20×, 25×, or 30×.
- Some adventures award different XP by route length; the higher value is reachable by taking the longer path.

## Capabilities and Constraints

- Navbar listing every utility; each utility is one route.
- LoR XP calculator: current level + XP into that level, target level (default max, 50), runs needed per adventure at each multiplier, with the fewest-run choice surfaced.
- Adventure XP values must match the LoR wiki (wiki.leagueoflegends.com) at sync time.
- *(inferred)* No accounts, no backend, no tracking.

## Brand Commitments

Name: z-tools. No other brand assets exist.

## Evidence on Hand

LoR adventure and level data synced from the LoR wiki. No testimonials, usage stats, or endorsements exist; never fabricate any. Not affiliated with Riot Games.

## Product Principles

1. The right number, provably: data has a source and a test.
2. Enter what the game shows you; the tool converts.
3. One glance answers the question; detail is there when wanted.
4. Each new game slots in without redesigning the shell.

## Accessibility & Inclusion

*(inferred)* WCAG AA contrast, full keyboard operation, usable at phone width.
