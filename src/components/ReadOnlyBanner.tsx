import React from 'react';

// A small, honest notice shown on the input tabs. The public site is a frozen
// leaderboard, so this tells the user up front that they can explore and
// calculate values but can't submit anything.
const ReadOnlyBanner: React.FC = () => (
  <div className="bg-amber-900 bg-opacity-40 border border-amber-600 text-amber-100 rounded-lg p-3 mb-4 text-sm">
    <span className="font-semibold">Read-only demo.</span> The leaderboard is
    frozen, so profiles and collections can&apos;t be saved. You can still browse
    the rankings and calculate your account value below.
  </div>
);

export default ReadOnlyBanner;
