# MLBB Collector Tracker

A web application for Mobile Legends: Bang Bang (MLBB) players to track their skin collection, calculate account value, and see rankings.

## Features

- **Profile Management**: Create and manage your player profile with game name, region, and player ID
- **Collection Tracking**: Track skins by tier (Supreme, Grand, Exquisite, etc.)
- **Value Calculation**:
  - Points calculation based on skin tiers
  - Account worth based on collector tier
  - Diamond value conversion
  - RM (Malaysian Ringgit) value calculation
- **Rankings**: View top collectors globally and by region
- **Stats**: See your rank and percentile among other collectors

## Skin Tiers and Values

| Tier | Points | Diamond Cost |
|------|--------|--------------|
| Supreme | 4,000 | 10,000 |
| Grand | 3,000 | 5,000 |
| Exquisite | 2,000 | 4,000 |
| Deluxe | 400 | 1,000 |
| Exceptional | 200 | 500 |
| Common | 100 | 300 |
| Painted | 40 | 100 |

## Collector Tiers

| Tier | Threshold | Multiplier |
|------|-----------|------------|
| World Collector | 280,000 | 2.0 |
| Mega Collector | 160,000 | 1.8 |
| Exalted Collector | 84,000 | 1.6 |
| Renowned Collector | 44,000 | 1.4 |
| Expert Collector | 22,000 | 1.2 |
| Seasoned Collector | 10,000 | 1.1 |

## Project Status

The public deployment runs as a **frozen, read-only leaderboard**: Firestore
writes are disabled in `firestore.rules` (`allow write: if false`) so the
existing rankings can't be tampered with. Reads stay open so the leaderboard
keeps working. Clone the repo and point it at your own Firebase project (with
writes enabled) to use the profile/collection editing flow.

## Technologies Used

- Next.js 15 (App Router, static export)
- React 19
- TypeScript
- Tailwind CSS
- Firebase (Firestore + Storage)
- Vitest (unit tests)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Set up security rules for Firestore
4. Create a web app and copy the configuration details to your `.env.local` file

## Testing

The scoring/ranking logic in `src/lib/mlbbUtils.ts` is covered by unit tests
(Vitest). These pure functions are the app's core business rules, so they're
tested in isolation without a browser or Firebase.

```
npm test          # run once
npm run test:watch  # re-run on change
```

## Deployment

This project is configured as a **static export** (`output: 'export'` in
`next.config.js`), so `npm run build` produces a plain static site in the `out/`
directory. It's deployed to Firebase Hosting:

```
npm run build       # generates the static site in out/
npm run firebase-deploy   # build + firebase deploy
```

Because it's a static export, there are no server-side API routes or middleware —
all logic runs in the browser and talks to Firebase directly.

## License

MIT