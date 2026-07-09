import { describe, it, expect } from 'vitest';
import {
  calculateTotalPoints,
  calculateDiamondValue,
  calculateRMValue,
  calculateAccountWorth,
  getCollectionStats,
  getTierInfo,
  formatNumber,
  getUserRank,
  calculatePercentile,
} from './mlbbUtils';
import { CollectorItem, UserProfile } from '../types/mlbb';

// --- Small helpers to keep the tests readable ---

// Build a collection, defaulting every tier to 0 and overriding only what a
// given test cares about.
const collection = (overrides: Partial<CollectorItem> = {}): CollectorItem => ({
  supreme: 0,
  grand: 0,
  exquisite: 0,
  deluxe: 0,
  exceptional: 0,
  common: 0,
  painted: 0,
  ...overrides,
});

// The ranking functions only read `totalPoints`, so we build a minimal profile
// with just that field and cast it to the full type.
const userWithPoints = (totalPoints: number): UserProfile =>
  ({ totalPoints } as UserProfile);

describe('calculateTotalPoints', () => {
  it('is 0 for an empty collection', () => {
    expect(calculateTotalPoints(collection())).toBe(0);
  });

  it('multiplies each tier count by its point value and sums them', () => {
    // 2 supreme (2 * 4000) + 5 painted (5 * 40) = 8000 + 200
    expect(calculateTotalPoints(collection({ supreme: 2, painted: 5 }))).toBe(8200);
  });
});

describe('calculateDiamondValue', () => {
  it('sums the diamond cost of every owned item', () => {
    // 1 supreme (10000) + 3 common (3 * 300) = 10000 + 900
    expect(calculateDiamondValue(collection({ supreme: 1, common: 3 }))).toBe(10900);
  });
});

describe('calculateRMValue', () => {
  it('converts diamonds to RM at the documented ratio', () => {
    // 1,200,000 diamonds map to roughly RM50,000.
    expect(calculateRMValue(1_200_000)).toBe(50000);
  });

  it('is 0 for 0 diamonds', () => {
    expect(calculateRMValue(0)).toBe(0);
  });
});

describe('calculateAccountWorth', () => {
  it('returns the raw points when no collector tier is reached', () => {
    // Below the lowest threshold (Seasoned = 10,000), so no multiplier applies.
    expect(calculateAccountWorth(5000)).toBe(5000);
  });

  it('applies the multiplier at a tier boundary (Seasoned x1.1)', () => {
    expect(calculateAccountWorth(10000)).toBe(11000);
  });

  it('applies the highest tier reached, not a lower one', () => {
    // 160,000 reaches Mega (x1.8), so it must NOT settle for Seasoned (x1.1).
    expect(calculateAccountWorth(160000)).toBe(288000);
  });

  it('applies World Collector (x2) at the top tier', () => {
    expect(calculateAccountWorth(300000)).toBe(600000);
  });

  it('does not apply a tier just below its threshold', () => {
    expect(calculateAccountWorth(9999)).toBe(9999);
  });
});

describe('getCollectionStats', () => {
  it('reports the score for every reached tier and 0 for the rest', () => {
    // 100,000 points reaches Exalted (84k) and below, but not Mega (160k).
    const stats = getCollectionStats(100000);
    expect(stats.worldCollector).toBe(0);
    expect(stats.megaCollector).toBe(0);
    expect(stats.exaltedCollector).toBe(100000);
    expect(stats.seasonedCollector).toBe(100000);
  });
});

describe('getTierInfo', () => {
  it('returns one entry per tier with derived worth and diamond value', () => {
    const info = getTierInfo(collection({ supreme: 3 }));
    expect(info).toHaveLength(7);

    const supreme = info.find((tier) => tier.name === 'supreme');
    expect(supreme).toMatchObject({
      count: 3,
      worth: 12000, // 3 * 4000 points
      diamondValue: 30000, // 3 * 10000 diamonds
    });
  });
});

describe('formatNumber', () => {
  it('inserts thousands separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('leaves small numbers unchanged', () => {
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('getUserRank', () => {
  it('is 0 when there are no users to rank against', () => {
    expect(getUserRank(500, [])).toBe(0);
  });

  it('is 1 for the top scorer', () => {
    const others = [userWithPoints(100), userWithPoints(50)];
    expect(getUserRank(300, others)).toBe(1);
  });

  it('does not count tied users as ranked above', () => {
    // Two users share 100 points; a user on 100 has nobody strictly above them.
    const others = [userWithPoints(100), userWithPoints(100), userWithPoints(50)];
    expect(getUserRank(100, others)).toBe(1);
  });

  it('ranks the lowest scorer last instead of returning 0', () => {
    // Regression guard: the lowest-ranked user must not report rank 0.
    const others = [userWithPoints(300), userWithPoints(200), userWithPoints(100)];
    expect(getUserRank(50, others)).toBe(4);
  });
});

describe('calculatePercentile', () => {
  it('is 0 when there are no users', () => {
    expect(calculatePercentile(500, [])).toBe(0);
  });

  it('expresses rank as a top-X% of the population', () => {
    // Population of 10; only 900 and 800 beat a user on 750, so they rank 3rd.
    // Rank 3 out of 10 -> top 30%.
    const population = [900, 800, 700, 600, 500, 400, 300, 200, 100, 50].map(userWithPoints);
    expect(calculatePercentile(750, population)).toBe(30);
  });
});
