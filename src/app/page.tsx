'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/mlbb';
import Header from '../components/Header';
import TabNavigation, { TabId } from '../components/TabNavigation';
import ProfileForm from '../components/ProfileForm';
import CollectionForm from '../components/CollectionForm';
import Rankings from '../components/Rankings';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification, { NotificationType } from '../components/Notification';
import { 
  saveUserProfile, 
  getUserByPlayerId, 
  getTopUsers,
  getAllUsers 
} from '../lib/firebase/mlbbService';
import { calculatePercentile, getUserRank } from '../lib/mlbbUtils';

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

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileCreated, setProfileCreated] = useState<boolean>(false);
  
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
  
  // Tab change handler
  const handleTabChange = (tab: TabId) => {
    // Always allow switching tabs
    setActiveTab(tab);
    
    // If switching to Collection and no current user, create a temporary one
    if (tab === 'collection' && !currentUser && !profileCreated) {
      showNotification('Please save your profile first', 'info');
    }
  };
  
  // Fetch user data from Firebase - wrapped in useCallback to use in the dependency array
  const fetchUserData = useCallback(async (playerId: string) => {
    try {
      const userData = await getUserByPlayerId(playerId);
      if (userData) {
        // Fetch all users to calculate percentile and rank
        const allUsers = await getAllUsers();
        
        const userWithStats = {
          ...userData,
          percentile: calculatePercentile(userData.totalPoints, allUsers),
          rank: getUserRank(userData.totalPoints, allUsers)
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
  }, []);
  
  // Fetch top users from Firebase - wrapped in useCallback to use in the dependency array
  const fetchTopUsers = useCallback(async () => {
    setLoading(true);
    try {
      const users = await getTopUsers(10);
      setTopUsers(users);
    } catch (error) {
      console.error('Error fetching top users:', error);
      showNotification('Failed to load rankings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);
  
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
    
    fetchTopUsers();
  }, [fetchUserData, fetchTopUsers]);
  
  // Handle saving the user profile
  const handleSaveProfile = async (profile: UserProfile) => {
    try {
      const userId = await saveUserProfile(profile);
      
      const allUsers = await getAllUsers();
      
      const updatedProfile = {
        ...profile,
        id: userId,
        percentile: calculatePercentile(profile.totalPoints, allUsers),
        rank: getUserRank(profile.totalPoints, allUsers)
      };
      
      setCurrentUser(updatedProfile);
      setProfileCreated(true);
      localStorage.setItem('mlbbCurrentUser', JSON.stringify(updatedProfile));
      showNotification('Profile saved successfully!', 'success');
      
      // Always navigate to collection tab after saving profile
      setActiveTab('collection');
      
      // Update top users list
      fetchTopUsers();
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Failed to save profile', 'error');
    }
  };
  
  // Handle saving collection
  const handleSaveCollection = async (profile: UserProfile) => {
    try {
      await saveUserProfile(profile);
      
      const allUsers = await getAllUsers();
      
      const updatedProfile = {
        ...profile,
        percentile: calculatePercentile(profile.totalPoints, allUsers),
        rank: getUserRank(profile.totalPoints, allUsers)
      };
      
      setCurrentUser(updatedProfile);
      localStorage.setItem('mlbbCurrentUser', JSON.stringify(updatedProfile));
      showNotification('Collection saved successfully!', 'success');
      
      // Auto switch to rankings after collection is saved
      setActiveTab('rankings');
      
      // Update top users list
      fetchTopUsers();
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
              <p className="text-white mb-4">Please save your profile before adding collection details.</p>
              <button 
                onClick={() => setActiveTab('profile')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Go to Profile
              </button>
            </div>
          )}
          
          {activeTab === 'rankings' && (
            <>
              {loading ? (
                <LoadingSpinner size="large" />
              ) : (
                <Rankings
                  topUsers={topUsers}
                  currentUser={currentUser || undefined}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
    </main>
  );
}
