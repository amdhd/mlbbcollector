import React, { useState } from 'react';
import { UserProfile, CollectorItem } from '../types/mlbb';
import { calculateTotalPoints, calculateAccountWorth } from '../lib/mlbbUtils';
import { IS_READ_ONLY } from '../lib/config';
import ImageUpload from './ImageUpload';

interface ProfileFormProps {
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const REGIONS = [
  'Johor', 'Kuala Lumpur', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Selangor', 
  'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 
  'Sarawak', 'Terengganu', 
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
  const [profileImageUrl, setProfileImageUrl] = useState(initialProfile?.profileImageUrl || '');
  
  const handleImageUploaded = (url: string) => {
    setProfileImageUrl(url);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Saving is disabled on the read-only demo; the button is disabled too, but
    // guard here as well so submitting via Enter can't slip through.
    if (IS_READ_ONLY) return;

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
      seasonJoined: initialProfile?.seasonJoined || '', // Keep previous value if it exists
      profileImageUrl,
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
  
  // Function to handle sharing
  const handleShare = async () => {
    try {
      const shareData = {
        title: 'MLBB Collector Rankings',
        text: "Let's see how much you've really spent! 💎",
        url: 'https://rankingml.com'
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Function to redirect to JollyMax diamonds page
  const redirectToJollyMax = () => {
    window.open('https://www.jollymax.com/my/mlbb_diamonds?from=smp_tt_20250408_home_mlbb_collector_0', '_blank');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 my-4">
      <h2 className="text-2xl font-bold text-orange-400 mb-4">Your Profile</h2>
      
      <div className="flex justify-center mb-6">
        <ImageUpload 
          initialImageUrl={profileImageUrl}
          onImageUploaded={handleImageUploaded}
          folder="profile-images"
          maxSizeMB={5}
        />
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-orange-300 mb-2">MLBB/Tiktok Username</label>
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
          <label className="block text-orange-300 mb-2">Player ID *for verification only</label>
          <input
            type="text"
            className="w-full bg-gray-700 text-white p-2 rounded"
            placeholder="Enter your player ID"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-orange-300 mb-2">State</label>
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
        
        <button
          type="submit"
          disabled={IS_READ_ONLY}
          className={`w-full text-white font-bold py-2 px-4 rounded transition-colors mb-4 ${
            IS_READ_ONLY
              ? 'bg-gray-600 cursor-not-allowed opacity-70'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {IS_READ_ONLY ? 'Saving disabled (read-only demo)' : 'Save Profile'}
        </button>
      </form>
      
      {/* Share buttons */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handleShare}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share App
        </button>
        <button
          type="button"
          onClick={redirectToJollyMax}
          className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center"
        >
          Buy Diamonds
        </button>
      </div>
    </div>
  );
};

export default ProfileForm; 