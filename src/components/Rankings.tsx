import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/mlbb';
import { formatNumber } from '../lib/mlbbUtils';

interface RankingsProps {
  topUsers: UserProfile[];
  currentUser?: UserProfile;
}

const RankingItem: React.FC<{ user: UserProfile; rank: number }> = ({ user, rank }) => {
  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-gray-300';
      case 3: return 'bg-amber-600';
      default: return 'bg-blue-600';
    }
  };

  const getNumberDisplay = (rank: number): string => {
    return rank.toString();
  };

  return (
    <div className="flex items-center p-1 sm:p-2 rounded-lg hover:bg-gray-700 transition-colors">
      <div className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${getRankColor(rank)} text-white text-xs sm:text-sm font-bold mr-2`}>
        {getNumberDisplay(rank)}
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <div className="font-semibold text-white text-sm">{user.name}</div>
          <div className="ml-2 text-xs px-1 py-0.5 rounded bg-gray-700 text-gray-300">{user.region}</div>
        </div>
      </div>
      <div className="text-base sm:text-lg font-bold text-orange-400">{formatNumber(user.totalPoints)}</div>
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

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 my-3 sm:my-4">
      <h2 className="text-xl font-bold text-orange-400 mb-3">Weekly Top Collectors</h2>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {regions.map(region => (
          <button
            key={region}
            className={`px-2 py-1 rounded-full text-xs ${
              filter === region 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setFilter(region)}
          >
            {region.toUpperCase()}
          </button>
        ))}
      </div>
      
      <div className="space-y-1">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => (
            <RankingItem 
              key={user.id || index} 
              user={user} 
              rank={index + 1} 
            />
          ))
        ) : (
          <div className="text-center text-gray-400 py-4 text-sm">No users found in this region</div>
        )}
      </div>
      
      {currentUser && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <h3 className="text-base font-semibold text-white mb-2">Your Ranking</h3>
          
          {currentUser.rank ? (
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-white text-sm mb-1">Rank</div>
                  <div className="text-2xl sm:text-3xl font-bold text-orange-400">#{currentUser.rank}</div>
                </div>
                <div>
                  <div className="text-white text-sm mb-1">You are in the top</div>
                  <div className="text-2xl sm:text-3xl font-bold text-orange-400">
                    {currentUser.percentile ? `${currentUser.percentile}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-white text-sm mb-1">Points</div>
                  <div className="text-2xl sm:text-3xl font-bold text-orange-400">{formatNumber(currentUser.totalPoints)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              Add your collection to see your ranking!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Rankings; 