import React, { useState, useEffect } from 'react';
import { UserProfile, CollectorItem } from '../types/mlbb';
import { calculateTotalPoints, calculateAccountWorth } from '../lib/mlbbUtils';

interface ProfileFormProps {
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const REGIONS = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 
  'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 
  'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur'
];

// Generate years from 2017 (MLBB release) to 2025
const YEARS = Array.from({ length: 9 }, (_, i) => (2017 + i).toString());

const defaultCollectionItems: CollectorItem = {
  supreme: 0,
  grand: 0,
  exquisite: 0,
  deluxe: 0,
  exceptional: 0,
  common: 0,
  painted: 0
};

const ProfileForm: React.FC<ProfileFormProps> = ({ onSave, initialProfile }) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [region, setRegion] = useState(initialProfile?.region || '');
  const [playerId, setPlayerId] = useState(initialProfile?.playerId || '');
  const [yearJoined, setYearJoined] = useState(initialProfile?.seasonJoined || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create empty collection points - these will be set in the Collection tab
    const collectionPoints = initialProfile?.collectionPoints || defaultCollectionItems;
    
    // Calculate total points and account worth
    const totalPoints = initialProfile?.totalPoints || 0;
    const accountWorth = initialProfile?.accountWorth || 0;
    const diamondValue = initialProfile?.diamondValue || 0;
    const rmValue = initialProfile?.rmValue || 0;
    
    const profile: UserProfile = {
      name,
      region,
      playerId,
      seasonJoined: yearJoined, // Keep using seasonJoined in the profile for backward compatibility
      collectionPoints,
      totalPoints,
      accountWorth,
      diamondValue,
      rmValue,
      createdAt: initialProfile?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    
    onSave(profile);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 my-4">
      <h2 className="text-2xl font-bold text-orange-400 mb-4">Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-orange-300 mb-2">Name</label>
          <input
            type="text"
            className="w-full bg-gray-700 text-white p-2 rounded"
            placeholder="Enter your game name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-orange-300 mb-2">Region</label>
          <select
            className="w-full bg-gray-700 text-white p-2 rounded"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            required
          >
            <option value="">Select your region</option>
            {REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-orange-300 mb-2">Player ID</label>
          <input
            type="text"
            className="w-full bg-gray-700 text-white p-2 rounded"
            placeholder="Enter your player ID"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-orange-300 mb-2">Year Joined</label>
          <select
            className="w-full bg-gray-700 text-white p-2 rounded"
            value={yearJoined}
            onChange={(e) => setYearJoined(e.target.value)}
          >
            <option value="">When did you start playing MLBB?</option>
            {YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default ProfileForm; 