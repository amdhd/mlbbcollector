// App-wide feature flags.

// The public deployment runs as a frozen, read-only leaderboard because
// Firestore writes are disabled in firestore.rules (`allow write: if false`).
// This flag mirrors that state in the UI so we never show a control (like a
// Save button) that would just fail. The calculators still work either way —
// they run entirely in the browser.
//
// Set NEXT_PUBLIC_READ_ONLY="false" (and enable writes in firestore.rules) when
// running against your own Firebase project to turn the editing/saving flow
// back on. Defaults to read-only so the deployed site is honest by default.
export const IS_READ_ONLY = process.env.NEXT_PUBLIC_READ_ONLY !== 'false';
