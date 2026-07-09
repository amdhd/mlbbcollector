import React, { useState } from 'react';
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseInt(e.target.value) || 0;
    // Limit to maximum available skins for this tier
    const validValue = Math.min(inputValue, totalSkins);
    onChange(tier, validValue);
  };
  
  // Calculate percentage of collection completion for this tier
  const completionPercentage = Math.round((value / totalSkins) * 100);
  const progressBarWidth = `${completionPercentage}%`;
  
  return (
    <div className="mb-3 p-4 rounded-lg bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: color }}></div>
            <div className="text-white font-medium">{capitalizedName} Items</div>
          </div>
          <div className="text-white text-sm opacity-80">
            {formatNumber(points)}pts 
            <span className="block text-xs opacity-70">
              {tier === 'supreme' && 'Legend Skins'}
              {tier === 'grand' && 'JJK, AOT Collab'}
              {tier === 'exquisite' && 'Collector Skin'}
              {tier === 'deluxe' && 'Epic Skins'}
              {tier === 'exceptional' && 'Elite, Special'}
              {tier === 'common' && 'Other'}
              {tier === 'painted' && 'Painted'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-24">
            <input
              type="number"
              min="0"
              max={totalSkins}
              className="w-full bg-gray-900 text-white p-2 rounded text-right text-lg font-bold"
              value={value}
              onChange={handleInputChange}
            />
          </div>
          <div className="text-right text-white text-sm min-w-[60px]">
            {value}/{totalSkins}
          </div>
        </div>
      </div>
      {/* Progress bar showing collection completion */}
      <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div 
          className="h-full rounded-full" 
          style={{ 
            width: progressBarWidth, 
            backgroundColor: color 
          }}
        ></div>
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
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const handleTierChange = (tier: CollectorTier, value: number) => {
    // Ensure value doesn't exceed max for tier
    const validValue = Math.min(value, TOTAL_SKINS[tier]);
    
    setCollectionPoints(prev => ({
      ...prev,
      [tier]: validValue
    }));
    
    // Clear validation error when user enters data
    setValidationError(null);
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
    
    // Validate that at least one skin tier has a value
    if (totalSkinsOwned === 0) {
      setValidationError("Please enter at least one skin in any tier before saving");
      return;
    }
    
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
          
          {validationError && (
            <div className="bg-red-900 bg-opacity-50 text-white p-3 rounded-lg mb-4">
              <p className="text-sm">{validationError}</p>
            </div>
          )}
          
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
        
        <p className="text-center text-gray-400 text-xs mt-4 italic">
          Note: All diamond and RM values are estimates and not exact figures. Actual values may vary.
        </p>
      </form>
    </div>
  );
};

export default CollectionForm; 