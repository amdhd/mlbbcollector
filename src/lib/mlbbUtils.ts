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

// Calculate RM value based on diamond value (approximate conversion)
export const calculateRMValue = (diamondValue: number): number => {
  // New conversion: RM50k for 630,200 collector points (as per data)
  const conversionRate = 50000 / 1200000;
  return Math.round(diamondValue * conversionRate);
};

// Calculate account worth based on total points
export const calculateAccountWorth = (totalPoints: number): number => {
  // Find the highest tier the user qualifies for
  const tier = Object.entries(COLLECTION_TIERS).find(([_, { threshold }]) => 
    totalPoints >= threshold
  );
  
  // Apply the appropriate multiplier, or 1 if no tier matched
  return tier 
    ? Math.round(totalPoints * tier[1].multiplier) 
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

// Function to calculate user's percentile based on their rank and total number of users
export const calculatePercentile = (userPoints: number, allUsers: UserProfile[]): number => {
  if (!allUsers.length) return 0;
  
  // Sort users by points in descending order
  const sortedUsers = [...allUsers].sort((a, b) => b.totalPoints - a.totalPoints);
  
  // Find user's rank (position in the sorted array + 1)
  const userRank = sortedUsers.findIndex(user => user.totalPoints <= userPoints) + 1;
  
  // Calculate top X% - lower percentages are better (top 10% is better than top 50%)
  // For example: Rank 3 out of 10 users means user is in top 30%
  return Math.round((userRank * 100) / allUsers.length);
};

// Get the user's rank
export const getUserRank = (userPoints: number, allUsers: UserProfile[]): number => {
  if (!allUsers.length) return 0;
  
  // Sort users by points in descending order and find the user's position
  // This gives us the rank (1st, 2nd, 3rd, etc.)
  return [...allUsers]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .findIndex(user => user.totalPoints <= userPoints) + 1;
}; 