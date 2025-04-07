import React, { useState, useEffect } from 'react';
import { UserProfile, CollectorItem, CollectorTier } from '../types/mlbb';
import { 
  ITEM_POINTS, 
  DIAMOND_COSTS, 
  TIER_COLORS, 
  calculateTotalPoints, 
  calculateAccountWorth, 
  calculateDiamondValue,
  calculateRMValue,
  formatNumber 
} from '../lib/mlbbUtils';

interface CollectionFormProps {
  onSave: (profile: UserProfile) => void;
  initialProfile: UserProfile;
}

interface TierItemProps {
  tier: CollectorTier;
  color: string;
  points: number;
  diamondCost: number;
  value: number;
  onChange: (tier: CollectorTier, value: number) => void;
}

// Total skins data from the screenshot
const TOTAL_SKINS: Record<CollectorTier, number> = {
  supreme: 14,
  grand: 84,
  exquisite: 97,
  deluxe: 128,
  exceptional: 241,
  common: 263,
  painted: 124 // Assumed based on common pattern
};

const TierItem: React.FC<TierItemProps> = ({ tier, color, points, diamondCost, value, onChange }) => {
  const capitalizedName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const totalSkins = TOTAL_SKINS[tier];
  
  return (
    <div className="mb-3 p-4 rounded-lg bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: color }}></div>
          <div className="text-white font-medium">{capitalizedName} Items</div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-28">
            <input
              type="number"
              min="0"
              className="w-full bg-gray-900 text-white p-2 rounded text-right text-lg font-bold"
              value={value}
              onChange={(e) => onChange(tier, parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="text-right text-white text-sm min-w-[60px]">
            {value}/{totalSkins}
          </div>
        </div>
      </div>
      <div className="text-white text-sm opacity-80">
        {formatNumber(points)}pts {formatNumber(diamondCost)}💎
      </div>
    </div>
  );
};

const CollectionForm: React.FC<CollectionFormProps> = ({ onSave, initialProfile }) => {
  const [collectionPoints, setCollectionPoints] = useState<CollectorItem>(
    initialProfile.collectionPoints || {
      supreme: 0,
      grand: 0,
      exquisite: 0,
      deluxe: 0,
      exceptional: 0,
      common: 0,
      painted: 0
    }
  );
  
  const handleTierChange = (tier: CollectorTier, value: number) => {
    setCollectionPoints(prev => ({
      ...prev,
      [tier]: value
    }));
  };
  
  const totalPoints = calculateTotalPoints(collectionPoints);
  const accountWorth = calculateAccountWorth(totalPoints);
  const diamondValue = calculateDiamondValue(collectionPoints);
  const rmValue = calculateRMValue(diamondValue);
  
  // Calculate total skins owned and total available
  const totalSkinsOwned = Object.values(collectionPoints).reduce((sum, count) => sum + count, 0);
  const totalSkinsAvailable = Object.values(TOTAL_SKINS).reduce((sum, count) => sum + count, 0);
  
  const getTierTotal = (tier: CollectorTier): number => {
    return collectionPoints[tier] * ITEM_POINTS[tier];
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedProfile: UserProfile = {
      ...initialProfile,
      collectionPoints,
      totalPoints,
      accountWorth,
      diamondValue,
      rmValue,
      updatedAt: Date.now()
    };
    
    onSave(updatedProfile);
  };
  
  const tiers: CollectorTier[] = ['supreme', 'grand', 'exquisite', 'deluxe', 'exceptional', 'common', 'painted'];
  
  return (
    <div className="bg-gray-900 rounded-lg p-3 my-3">
      <h2 className="text-xl font-bold text-white mb-3">Your Collection Points</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-red-900 bg-opacity-40 p-3 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm sm:text-base text-white mb-1">World Collector V</div>
          <div className="text-xl sm:text-2xl font-bold text-orange-400">{formatNumber(280000)}</div>
        </div>
        <div className="bg-orange-900 bg-opacity-40 p-3 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm sm:text-base text-white mb-1">Mega Collector V</div>
          <div className="text-xl sm:text-2xl font-bold text-orange-400">{formatNumber(160000)}</div>
        </div>
        <div className="bg-pink-900 bg-opacity-40 p-3 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm sm:text-base text-white mb-1">Exalted Collector V</div>
          <div className="text-xl sm:text-2xl font-bold text-orange-400">{formatNumber(84000)}</div>
        </div>
        <div className="bg-purple-900 bg-opacity-40 p-3 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm sm:text-base text-white mb-1">Renowned Collector V</div>
          <div className="text-xl sm:text-2xl font-bold text-orange-400">{formatNumber(44000)}</div>
        </div>
        <div className="bg-blue-900 bg-opacity-40 p-3 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm sm:text-base text-white mb-1">Expert Collector V</div>
          <div className="text-xl sm:text-2xl font-bold text-orange-400">{formatNumber(22000)}</div>
        </div>
        <div className="bg-teal-900 bg-opacity-40 p-3 rounded-lg flex flex-col items-center justify-center">
          <div className="text-sm sm:text-base text-white mb-1">Seasoned Collector V</div>
          <div className="text-xl sm:text-2xl font-bold text-orange-400">{formatNumber(10000)}</div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="bg-indigo-900 bg-opacity-30 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold text-white mb-4">Input Your Collection:</h3>
          
          {tiers.map(tier => (
            <TierItem
              key={tier}
              tier={tier}
              color={TIER_COLORS[tier]}
              points={ITEM_POINTS[tier]}
              diamondCost={DIAMOND_COSTS[tier]}
              value={collectionPoints[tier]}
              onChange={handleTierChange}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-3 rounded-lg">
            <div className="text-white text-xs sm:text-sm opacity-80">Total Points</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{formatNumber(totalPoints)}</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-lg">
            <div className="text-white text-xs sm:text-sm opacity-80">Diamond Value</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{formatNumber(diamondValue)} 💎</div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-lg">
            <div className="text-white text-xs sm:text-sm opacity-80">RM Value</div>
            <div className="text-xl sm:text-2xl font-bold text-white">RM {formatNumber(rmValue)}</div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-lg">
            <div className="text-white text-xs sm:text-sm opacity-80">Total Skins</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{totalSkinsOwned}/{totalSkinsAvailable} <span className="text-sm opacity-80 ml-2">({Math.round(totalSkinsOwned/totalSkinsAvailable*100)}%)</span></div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Save Collection
        </button>
      </form>
    </div>
  );
};

export default CollectionForm; 