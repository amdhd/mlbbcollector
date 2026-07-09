# MLBB Collector Tracker

Track your Mobile Legends: Bang Bang skin collection, estimate what the account
is worth, and see how it ranks against other players.

**Live demo:** [rankingml.com](https://rankingml.com) — a frozen, read-only
leaderboard (see [Project status](#project-status)).

<!-- Add a screenshot for a stronger first impression, e.g. docs/screenshot.png:
![MLBB Collector Tracker](docs/screenshot.png) -->

## Overview

Mobile Legends assigns every cosmetic a tier (Supreme, Grand, … Painted). A
player enters how many skins they own per tier, and the app turns that into:

- a **collection score** — points weighted by tier;
- an **account "worth"** — the score boosted by the highest collector tier it
  unlocks;
- **diamond and RM (Malaysian Ringgit) estimates** of what that represents; and
- a **rank and percentile** against everyone else on the leaderboard.

The scoring rules live in one small, pure module and are covered by unit tests.

## Project status

The public deployment is a **frozen, read-only leaderboard**. Firestore writes
are disabled in `firestore.rules` (`allow write: if false`) so the existing
rankings can't be altered; reads stay open so the board keeps working.

The UI is honest about this: the Save buttons are disabled and a banner explains
that submissions are closed, while the value calculators keep working (they run
entirely in the browser). This is driven by the `NEXT_PUBLIC_READ_ONLY` flag —
set it to `"false"` and enable writes in `firestore.rules` to run the full
editing flow against your own Firebase project.

## Tech stack

| Area      | Choice                                                    |
| --------- | --------------------------------------------------------- |
| Framework | Next.js 15 (App Router), exported as a static site        |
| Language  | TypeScript (strict mode)                                  |
| UI        | React 19, Tailwind CSS                                    |
| Backend   | Firebase — Firestore (data), Storage (profile images)     |
| Tests     | Vitest                                                    |
| CI        | GitHub Actions — tests and build on every push and PR     |

## Architecture

A few decisions worth calling out:

- **Static export, no server.** `next.config.js` sets `output: 'export'`, so the
  app builds to plain HTML/JS hosted on Firebase Hosting. Everything runs in the
  browser and talks to Firebase directly — there are no API routes or middleware.
- **Pure business logic, isolated and tested.** Every scoring rule (points,
  worth, diamond/RM value, rank, percentile) is a pure function in
  `src/lib/mlbbUtils.ts`. With no I/O to mock, they're unit-tested directly.
- **A thin data-access layer.** All Firestore access goes through
  `src/lib/firebase/mlbbService.ts`, so components never touch the database
  directly and user input is sanitized in one place.
- **A single state hub.** `src/app/page.tsx` owns the shared state (current user
  and leaderboard) and passes it to the tab views; the current user is cached in
  `localStorage` for instant reloads.
- **One feature flag for read-only mode**, so the same codebase runs as the
  frozen public demo or as a fully writable app.

## Project structure

```
src/
  app/          # App Router entry — the single page and root layout
  components/   # UI: profile/collection forms, rankings, header, notifications
  lib/
    mlbbUtils.ts    # pure scoring/ranking logic (unit-tested)
    config.ts       # read-only feature flag
    firebase/       # Firebase init + data-access layer
  types/        # shared TypeScript types
```

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Firebase project config
npm run dev
```

The app runs read-only by default. To enable saving, set
`NEXT_PUBLIC_READ_ONLY="false"` in `.env.local` and allow writes in
`firestore.rules`.

## Testing

```bash
npm test           # run the suite once
npm run test:watch # watch mode
```

Tests cover the scoring/ranking rules in `src/lib/mlbbUtils.ts`, including tier
boundaries and the rank/percentile edge cases (ties and the lowest-ranked user).

## Deployment

```bash
npm run build            # static export to out/
npm run firebase-deploy  # build, then firebase deploy
```

## Known limitations / possible improvements

- **Rank and percentile are computed client-side over the whole collection**
  (`getAllUsers`). That's fine for a small dataset but wouldn't scale; a
  server-side aggregate or Cloud Function would be the next step.
- Images use plain `<img>` rather than `next/image` — a trade-off for the static
  export, and currently surfaced as a lint warning.
- Diamond and RM figures are deliberate **estimates**, not exact prices.

## Reference data

<details>
<summary>Skin tiers and collector thresholds</summary>

**Points and diamond cost per skin tier**

| Tier        | Points | Diamond Cost |
| ----------- | ------ | ------------ |
| Supreme     | 4,000  | 10,000       |
| Grand       | 3,000  | 5,000        |
| Exquisite   | 2,000  | 4,000        |
| Deluxe      | 400    | 1,000        |
| Exceptional | 200    | 500          |
| Common      | 100    | 300          |
| Painted     | 40     | 100          |

**Collector tiers (account-worth multipliers)**

| Tier               | Threshold | Multiplier |
| ------------------ | --------- | ---------- |
| World Collector    | 280,000   | 2.0        |
| Mega Collector     | 160,000   | 1.8        |
| Exalted Collector  | 84,000    | 1.6        |
| Renowned Collector | 44,000    | 1.4        |
| Expert Collector   | 22,000    | 1.2        |
| Seasoned Collector | 10,000    | 1.1        |

</details>

## License

[MIT](LICENSE)
