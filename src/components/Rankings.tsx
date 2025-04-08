import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/mlbb';
import { formatNumber } from '../lib/mlbbUtils';

interface RankingsProps {
  topUsers: UserProfile[];
  currentUser?: UserProfile;
}

// Image popup modal component
const ProfileImageModal: React.FC<{ 
  imageUrl: string; 
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ imageUrl, userName, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-gray-800 rounded-lg overflow-hidden max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <h3 className="text-white font-medium">{userName}</h3>
          <button 
            className="text-gray-400 hover:text-white" 
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <img 
            src={imageUrl} 
            alt={`${userName}'s profile`}
            className="w-full h-auto rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=256`;
            }}
          />
        </div>
      </div>
    </div>
  );
};

const RankingItem: React.FC<{ user: UserProfile; rank: number }> = ({ user, rank }) => {
  const [showImageModal, setShowImageModal] = useState(false);

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-gray-300';
      case 3: return 'bg-amber-600';
      default: return 'bg-blue-600';
    }
  };

  const getInitials = (name: string): string => {
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBgColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'bg-blue-500';
      case 2: return 'bg-purple-500'; 
      case 3: return 'bg-pink-500';
      case 4: return 'bg-purple-500';
      case 5: return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const defaultAvatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=random&color=fff';

  return (
    <div 
      className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={() => setShowImageModal(true)}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getRankColor(rank)} text-white text-base font-bold mr-3`}>
        {rank}
      </div>
      
      <div 
        className={`h-10 w-10 rounded-full mr-3 flex items-center justify-center ${getAvatarBgColor(rank)} text-white font-bold text-lg hover:opacity-80 transition-opacity`}
      >
        {user.profileImageUrl ? (
          <img 
            src={user.profileImageUrl || defaultAvatarUrl} 
            alt={user.name}
            className="h-full w-full object-cover rounded-full"
            onError={(e) => {
              // If image fails to load, use default avatar
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = defaultAvatarUrl;
            }}
          />
        ) : (
          getInitials(user.name)
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center">
          <div className="font-semibold text-white text-base">{user.name}</div>
          <div className="ml-2 text-xs px-2 py-1 rounded-md bg-gray-700 text-gray-300">{user.region}</div>
        </div>
      </div>
      
      <div className="text-xl font-bold text-orange-400">{formatNumber(user.totalPoints)}</div>

      {/* Profile image modal */}
      <ProfileImageModal 
        imageUrl={user.profileImageUrl || defaultAvatarUrl}
        userName={user.name}
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
      />
    </div>
  );
};

const Rankings: React.FC<RankingsProps> = ({ topUsers, currentUser }) => {
  const [filter, setFilter] = useState<string>('all');
  const uniqueRegions = Array.from(new Set(topUsers.map(user => user.region)));
  const regions = ['all', ...uniqueRegions];

  const filteredUsers = filter === 'all'
    ? topUsers
    : topUsers.filter(user => user.region === filter);
  
  // Function to handle sharing
  const handleShare = async () => {
    try {
      const shareData = {
        title: 'MLBB Collector Rankings',
        text: 'Let’s see how much you’ve really spent! 💎 ',
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
    <div className="bg-gray-900 rounded-lg my-3">
      {/* User's current ranking at the top */}
      {currentUser && currentUser.rank && (
        <div className="mb-4 bg-gray-800 rounded-t-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Your Ranking</h3>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-white text-xs mb-1">Rank</div>
                <div className="text-2xl font-bold text-orange-400">#{currentUser.rank}</div>
              </div>
              <div>
                <div className="text-white text-xs mb-1">You are in the top</div>
                <div className="text-2xl font-bold text-orange-400">
                  {currentUser.percentile ? `${currentUser.percentile}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-white text-xs mb-1">Points</div>
                <div className="text-2xl font-bold text-orange-400">{formatNumber(currentUser.totalPoints)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-orange-400">Weekly Top 30 Collectors</h2>
        </div>
        
        <div className="mb-4">
          <select
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 w-full max-w-xs text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {regions.map(region => (
              <option key={region} value={region}>
                {region === 'all' ? 'ALL REGIONS' : region.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <RankingItem 
                key={user.id || index} 
                user={user} 
                rank={index + 1} 
              />
            ))
          ) : (
            <div className="text-center text-gray-400 py-6 text-sm">No users found in this region</div>
          )}
        </div>
        
        {/* Bottom share buttons - especially helpful on mobile */}
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
    </div>
  );
};

export default Rankings; 