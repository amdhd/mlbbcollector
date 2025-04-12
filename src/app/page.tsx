'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/mlbb';
import Header from '../components/Header';
import TabNavigation, { TabId } from '../components/TabNavigation';
import ProfileForm from '../components/ProfileForm';
import CollectionForm from '../components/CollectionForm';
import Rankings from '../components/Rankings';
import Help from '../components/Help';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification, { NotificationType } from '../components/Notification';
import { 
  saveUserProfile, 
  getUserByPlayerId, 
} from '../lib/firebase/mlbbService';
import { calculatePercentile, getUserRank } from '../lib/mlbbUtils';
import { initNetworkListeners, isOffline } from '../lib/firebase/firebaseUtils';
import { useDataPrefetch } from '../lib/hooks/useDataPrefetch';

const defaultProfile: UserProfile = {
  name: '',
  region: '',
  playerId: '',
  collectionPoints: {
    supreme: 0,
    grand: 0,
    exquisite: 0,
    deluxe: 0,
    exceptional: 0,
    common: 0,
    painted: 0
  },
  totalPoints: 0,
  accountWorth: 0,
  diamondValue: 0,
  rmValue: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// Get client IP address - this is a simple approach that works in many cases
// For a more accurate approach, you'd use a server-side API
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return 'unknown';
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileCreated, setProfileCreated] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // Use the data prefetch hook to handle all data fetching logic
  const { 
    topUsers, 
    allUsers, 
    topUsersFetchStatus, 
    allUsersFetchStatus, 
    fetchTopUsers, 
    fetchAllUsers 
  } = useDataPrefetch({ 
    prefetchAllUsers: true, 
    prefetchCount: 30
  });
  
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);
  
  // Show notification
  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
  };
  
  // Clear notification
  const clearNotification = () => {
    setNotification(null);
  };
  
  // Setup network detection
  useEffect(() => {
    const cleanup = initNetworkListeners((online) => {
      setIsOnline(online);
      
      if (!online) {
        showNotification('You are offline. Using cached data.', 'warning');
      } else {
        // When back online, refresh data
        fetchTopUsers(30, true);
        fetchAllUsers(true);
        if (currentUser?.playerId) {
          fetchUserData(currentUser.playerId);
        }
        showNotification('You are back online!', 'success');
      }
    });
    
    // Initial status
    setIsOnline(navigator.onLine);
    
    return cleanup;
  }, [currentUser, fetchTopUsers, fetchAllUsers]);
  
  // Tab change handler
  const handleTabChange = (tab: TabId) => {
    // Always allow switching tabs
    setActiveTab(tab);
    
    // If switching to Collection and no current user, create a temporary one
    if (tab === 'collection' && !currentUser && !profileCreated) {
      showNotification('Please save your profile first', 'info');
    }
    
    // If switching to rankings tab, make sure we have the latest data
    if (tab === 'rankings') {
      fetchTopUsers(30, false);
    }
  };
  
  // Fetch user data from Firebase
  const fetchUserData = useCallback(async (playerId: string) => {
    try {
      const userData = await getUserByPlayerId(playerId);
      if (userData) {
        // Use prefetched data for calculations
        const userWithStats = {
          ...userData,
          percentile: calculatePercentile(userData.totalPoints, allUsers.length > 0 ? allUsers : topUsers),
          rank: getUserRank(userData.totalPoints, allUsers.length > 0 ? allUsers : topUsers)
        };
        
        setCurrentUser(userWithStats);
        setProfileCreated(true);
        // Save to localStorage
        localStorage.setItem('mlbbCurrentUser', JSON.stringify(userWithStats));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showNotification('Failed to load user data', 'error');
    }
  }, [topUsers, allUsers]);
  
  // Handle data loading state
  useEffect(() => {
    // Set loading based on the fetch status
    setLoading(topUsersFetchStatus === 'loading');
    
    // If we have rankings data and we're on the rankings tab, we're done loading
    if (topUsers.length > 0 && activeTab === 'rankings') {
      setLoading(false);
    }
  }, [topUsersFetchStatus, topUsers, activeTab]);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('mlbbCurrentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Validate that the stored user has the minimum required data to be considered valid
        if (parsedUser && parsedUser.name && parsedUser.playerId) {
          setCurrentUser(parsedUser);
          setProfileCreated(true);
          
          // If a profile exists, immediately fetch their data to ensure it's up to date
          fetchUserData(parsedUser.playerId);
        } else {
          // If the stored data is incomplete, clear it and start fresh
          localStorage.removeItem('mlbbCurrentUser');
          console.log('Cleared invalid user data from localStorage');
        }
      } catch (error) {
        // If there's an error parsing, clear the invalid data
        localStorage.removeItem('mlbbCurrentUser');
        console.error('Failed to parse stored user data', error);
      }
    }
  }, [fetchUserData]);
  
  // Handle saving the user profile
  const handleSaveProfile = async (profile: UserProfile) => {
    try {
      // Get client IP for rate limiting
      const clientIP = await getClientIP();
      
      const userId = await saveUserProfile(profile, clientIP);
      
      // Ensure we have the latest data for calculations
      if (allUsers.length === 0) {
        await fetchAllUsers(true);
      }
      
      const updatedProfile = {
        ...profile,
        id: userId,
        percentile: calculatePercentile(profile.totalPoints, allUsers.length > 0 ? allUsers : topUsers),
        rank: getUserRank(profile.totalPoints, allUsers.length > 0 ? allUsers : topUsers)
      };
      
      setCurrentUser(updatedProfile);
      setProfileCreated(true);
      localStorage.setItem('mlbbCurrentUser', JSON.stringify(updatedProfile));
      showNotification('Profile saved successfully!', 'success');
      
      // Always navigate to collection tab after saving profile
      setActiveTab('collection');
      
      // Update top users list
      fetchTopUsers(30, true);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      
      // Check if this is a rate limit error
      if (error.message && error.message.includes('Profile submission limit reached')) {
        showNotification(error.message, 'error');
      } else {
        showNotification('Failed to save profile. Please try again later.', 'error');
      }
    }
  };
  
  // Handle saving collection
  const handleSaveCollection = async (profile: UserProfile) => {
    try {
      await saveUserProfile(profile);
      
      // Ensure we have the latest data for calculations
      if (allUsers.length === 0) {
        await fetchAllUsers(true);
      }
      
      const updatedProfile = {
        ...profile,
        percentile: calculatePercentile(profile.totalPoints, allUsers.length > 0 ? allUsers : topUsers),
        rank: getUserRank(profile.totalPoints, allUsers.length > 0 ? allUsers : topUsers)
      };
      
      setCurrentUser(updatedProfile);
      localStorage.setItem('mlbbCurrentUser', JSON.stringify(updatedProfile));
      showNotification('Collection saved successfully!', 'success');
      
      // Auto switch to rankings after collection is saved
      setActiveTab('rankings');
      
      // Update top users list
      fetchTopUsers(30, true);
    } catch (error) {
      console.error('Error saving collection:', error);
      showNotification('Failed to save collection', 'error');
    }
  };
  
  return (
    <main className="min-h-screen bg-gray-900">
      <Header currentUser={currentUser || undefined} />
      
      <div className="px-2 sm:px-4 py-4 sm:py-8">
        <TabNavigation
          activeTab={activeTab}
          onChange={handleTabChange}
        />
        
        <div className="mt-2 sm:mt-4">
          {activeTab === 'profile' && (
            <ProfileForm
              onSave={handleSaveProfile}
              initialProfile={currentUser || undefined}
            />
          )}
          
          {activeTab === 'collection' && (profileCreated || currentUser) && (
            <CollectionForm
              onSave={handleSaveCollection}
              initialProfile={currentUser || {...defaultProfile}}
            />
          )}
          
          {activeTab === 'collection' && !profileCreated && !currentUser && (
            <div className="bg-gray-800 rounded-lg p-6 my-4">
              <h2 className="text-xl font-bold text-orange-400 mb-4">Collection</h2>
              <p className="text-white">Please create your profile first before adding collection details.</p>
            </div>
          )}
          
          {activeTab === 'rankings' && (
            <>
              {loading ? (
                <div className="flex justify-center my-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <Rankings
                  topUsers={topUsers}
                  currentUser={currentUser || undefined}
                />
              )}
            </>
          )}
          
          {activeTab === 'help' && (
            <Help />
          )}
        </div>
        
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />
        )}
      </div>
    </main>
  );
}
