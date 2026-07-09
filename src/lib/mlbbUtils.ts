import { CollectorItem, CollectorTier, TierInfo, UserProfile, CollectionStats } from '../types/mlbb';

// Points per item tier
export const ITEM_POINTS: Record<CollectorTier, number> = {
  supreme: 4000,
  grand: 3000,
  exquisite: 2000,
  deluxe: 400,
  exceptional: 200,
  common: 100,
  painted: 40
};

// Diamond cost per item tier
export const DIAMOND_COSTS: Record<CollectorTier, number> = {
  supreme: 10000,
  grand: 5000,
  exquisite: 4000,
  deluxe: 1000,
  exceptional: 500,
  common: 300,
  painted: 100
};

// Collection tier thresholds
export const COLLECTION_TIERS = {
  worldCollector: { threshold: 280000, multiplier: 2 },
  megaCollector: { threshold: 160000, multiplier: 1.8 },
  exaltedCollector: { threshold: 84000, multiplier: 1.6 },
  renownedCollector: { threshold: 44000, multiplier: 1.4 },
  expertCollector: { threshold: 22000, multiplier: 1.2 },
  seasonedCollector: { threshold: 10000, multiplier: 1.1 }
};

// Get tier colors
export const TIER_COLORS: Record<CollectorTier, string> = {
  supreme: '#FF3333',
  grand: '#FF8C33',
  exquisite: '#E633FF',
  deluxe: '#9933FF',
  exceptional: '#33A3FF',
  common: '#33FF57',
  painted: '#996633'
};

// Calculate total points from collection items
export const calculateTotalPoints = (items: CollectorItem): number => {
  return Object.entries(items).reduce((total, [tier, count]) => {
    return total + ITEM_POINTS[tier as CollectorTier] * count;
  }, 0);
};

// Calculate total diamond value from collection items
export const calculateDiamondValue = (items: CollectorItem): number => {
  return Object.entries(items).reduce((total, [tier, count]) => {
    return total + DIAMOND_COSTS[tier as CollectorTier] * count;
  }, 0);
};

// Convert a diamond value into an approximate real-money value in Malaysian
// Ringgit (RM). This is a rough estimate only: roughly RM50,000 buys about
// 1,200,000 diamonds, so we scale by that ratio.
export const calculateRMValue = (diamondValue: number): number => {
  const RM_PER_DIAMOND = 50000 / 1200000;
  return Math.round(diamondValue * RM_PER_DIAMOND);
};

// Calculate an account's "worth" by boosting its points with a collector-tier
// multiplier. A bigger collection unlocks a higher tier, which multiplies the
// score more (e.g. World Collector doubles it).
export const calculateAccountWorth = (totalPoints: number): number => {
  // Sort tiers from highest threshold to lowest, then pick the first one the
  // user has enough points to reach. Sorting here (instead of relying on the
  // order the tiers happen to be declared in) keeps this correct even if
  // COLLECTION_TIERS is ever reordered.
  const qualifyingTier = Object.values(COLLECTION_TIERS)
    .sort((a, b) => b.threshold - a.threshold)
    .find(({ threshold }) => totalPoints >= threshold);

  // If the user hasn't reached any tier, their worth is just their raw points
  // (multiplier of 1).
  return qualifyingTier
    ? Math.round(totalPoints * qualifyingTier.multiplier)
    : totalPoints;
};

// Get collection statistics based on total points
export const getCollectionStats = (totalPoints: number): CollectionStats => {
  return {
    worldCollector: totalPoints >= COLLECTION_TIERS.worldCollector.threshold ? totalPoints : 0,
    megaCollector: totalPoints >= COLLECTION_TIERS.megaCollector.threshold ? totalPoints : 0,
    exaltedCollector: totalPoints >= COLLECTION_TIERS.exaltedCollector.threshold ? totalPoints : 0,
    renownedCollector: totalPoints >= COLLECTION_TIERS.renownedCollector.threshold ? totalPoints : 0,
    expertCollector: totalPoints >= COLLECTION_TIERS.expertCollector.threshold ? totalPoints : 0,
    seasonedCollector: totalPoints >= COLLECTION_TIERS.seasonedCollector.threshold ? totalPoints : 0
  };
};

// Get tier information with count and worth
export const getTierInfo = (items: CollectorItem): TierInfo[] => {
  return Object.entries(items).map(([tier, count]) => {
    const tierKey = tier as CollectorTier;
    const diamondCost = DIAMOND_COSTS[tierKey];
    return {
      name: tier,
      color: TIER_COLORS[tierKey],
      points: ITEM_POINTS[tierKey],
      count,
      worth: ITEM_POINTS[tierKey] * count,
      diamondCost,
      diamondValue: diamondCost * count
    };
  });
};

// Format large numbers with commas
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Get the user's rank: one more than the number of users who scored higher.
// This is always >= 1 for a non-empty list, even when the user's points are
// below every stored user or the user isn't in the list yet.
export const getUserRank = (userPoints: number, allUsers: UserProfile[]): number => {
  if (!allUsers.length) return 0;

  const usersAbove = allUsers.filter(user => user.totalPoints > userPoints).length;
  return usersAbove + 1;
};

// Calculate the user's percentile (top X% - lower is better).
// For example: rank 3 out of 10 users means the user is in the top 30%.
export const calculatePercentile = (userPoints: number, allUsers: UserProfile[]): number => {
  if (!allUsers.length) return 0;

  const userRank = getUserRank(userPoints, allUsers);
  return Math.round((userRank * 100) / allUsers.length);
}; 