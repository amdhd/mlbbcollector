import React, { useState } from 'react';
import { UserProfile } from '../types/mlbb';
import { formatNumber } from '../lib/mlbbUtils';

interface HeaderProps {
  currentUser?: UserProfile;
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  // State to track if the AVIF image fails to load
  const [imageError, setImageError] = useState(false);
  
  // Generate default avatar URL for users without a profile image
  const defaultAvatarUrl = currentUser?.name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random&color=fff`
    : imageError ? "/images/mlbb-hero.jpg" : "/images/mlbb-hero.avif";
  
  return (
    <header className="bg-indigo-900 text-white py-3 px-4">
      <div className="max-w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-orange-400 text-center mb-3">
          MLBB Collector Ranking 
        </h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative w-12 h-12 mr-3 rounded-full overflow-hidden border-2 border-blue-400 bg-blue-800">
              <img 
                src={currentUser?.profileImageUrl || defaultAvatarUrl} 
                onError={(e) => {
                  setImageError(true);
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite loop
                  target.src = imageError ? "/images/mlbb-hero.jpg" : defaultAvatarUrl;
                }}
                alt="Profile avatar"
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              {currentUser?.name ? (
                <>
                  <div className="text-base font-semibold text-white">
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentUser.region}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-400">
                  No profile
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-indigo-800 rounded-lg p-2 text-center">
            <div className="flex items-center justify-between">
              <div className="mr-5">
                <div className="text-xs text-gray-300 font-bold">Total Spent</div>
                <div className="text-lg font-bold text-green-400">
                  RM {currentUser?.rmValue ? formatNumber(currentUser.rmValue) : '0'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-300 font-bold">Diamonds</div>
                <div className="text-lg font-bold text-blue-400">
                  {currentUser?.diamondValue ? formatNumber(currentUser.diamondValue) : '0'} 💎
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 