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

## Technologies Used

- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Firestore)

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

## Deployment

The app can be deployed to Vercel or any other hosting service that supports Next.js:

```
npm run build
npm run start
```

## License

MIT

# MLBB Collector - Delete Empty Collections Script

This script will delete users from the MLBB Collector database who have registered but haven't added any skin collections (where all skin tier counts are 0).

## Prerequisites

- Node.js installed
- Firebase Admin SDK package installed

## Installation

1. Install the required package:

```bash
npm install firebase-admin
```

2. The script already contains the embedded Firebase Admin credentials.

## Usage

Simply run the script with Node.js:

```bash
node delete-empty-collections.js
```

## What the script does

1. Connects to the Firebase Firestore database using the embedded admin credentials
2. Fetches all users from the 'mlbbUsers' collection
3. For each user, checks if all skin tier counts are 0
4. Deletes users with no skin collections
5. Outputs a summary of how many users were found and deleted

## Security Note

- The credentials in this script provide administrative access to your Firebase project
- After using this script, consider rotating your Firebase Admin SDK credentials
- Do not share this script publicly as it contains sensitive credentials