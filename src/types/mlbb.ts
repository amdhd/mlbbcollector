export interface CollectorItem {
  supreme: number;
  grand: number;
  exquisite: number;
  deluxe: number;
  exceptional: number;
  common: number;
  painted: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  region: string;
  playerId: string;
  seasonJoined?: string;
  collectionPoints: CollectorItem;
  totalPoints: number;
  accountWorth: number;
  diamondValue: number;
  rmValue: number;
  percentile?: number;
  rank?: number;
  createdAt: number;
  updatedAt: number;
}

export type CollectorTier = 
  | 'supreme'
  | 'grand'
  | 'exquisite'
  | 'deluxe'
  | 'exceptional'
  | 'common'
  | 'painted';

export interface TierInfo {
  name: string;
  color: string;
  points: number;
  count: number;
  worth: number;
  diamondCost: number;
  diamondValue: number;
}

export interface CollectionStats {
  worldCollector: number;
  megaCollector: number;
  exaltedCollector: number;
  renownedCollector: number;
  expertCollector: number;
  seasonedCollector: number;
} 