import { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile } from '../../types/mlbb';
import { getTopUsers, getAllUsers } from '../firebase/mlbbService';
import { isOffline } from '../firebase/firebaseUtils';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface DataPrefetchOptions {
  prefetchAllUsers?: boolean;
  prefetchCount?: number;
  debounceMs?: number;
}

/**
 * Hook for optimized data fetching with prefetching, debouncing, and caching
 */
export const useDataPrefetch = (options: DataPrefetchOptions = {}) => {
  const {
    prefetchAllUsers = false,
    prefetchCount = 30,
    debounceMs = 300
  } = options;
  
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [topUsersFetchStatus, setTopUsersFetchStatus] = useState<FetchStatus>('idle');
  const [allUsersFetchStatus, setAllUsersFetchStatus] = useState<FetchStatus>('idle');
  const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});
  
  // Refs for debouncing
  const topUsersDebounceTimer = useRef<NodeJS.Timeout>();
  const allUsersDebounceTimer = useRef<NodeJS.Timeout>();
  
  // Prefetch top users with debouncing
  const fetchTopUsers = useCallback(async (count = prefetchCount, force = false) => {
    // Prevent excessive calls within debounce period
    const now = Date.now();
    const minInterval = 5000; // 5 seconds
    
    if (
      !force && 
      topUsersFetchStatus === 'loading' || 
      (lastFetchTime.topUsers && now - lastFetchTime.topUsers < minInterval)
    ) {
      return;
    }
    
    // Clear any existing timer
    if (topUsersDebounceTimer.current) {
      clearTimeout(topUsersDebounceTimer.current);
    }
    
    // Set up a debounced call
    topUsersDebounceTimer.current = setTimeout(async () => {
      try {
        if (isOffline() && topUsers.length > 0) {
          console.log('Offline: Using cached top users data');
          return;
        }
        
        setTopUsersFetchStatus('loading');
        const data = await getTopUsers(count);
        setTopUsers(data);
        setLastFetchTime(prev => ({ ...prev, topUsers: Date.now() }));
        setTopUsersFetchStatus('success');
      } catch (error) {
        console.error('Error fetching top users:', error);
        setTopUsersFetchStatus('error');
      }
    }, debounceMs);
    
  }, [debounceMs, prefetchCount, topUsersFetchStatus, lastFetchTime, topUsers.length]);
  
  // Prefetch all users with debouncing
  const fetchAllUsers = useCallback(async (force = false) => {
    // Prevent excessive calls within debounce period
    const now = Date.now();
    const minInterval = 30000; // 30 seconds
    
    if (
      !force && 
      allUsersFetchStatus === 'loading' || 
      (lastFetchTime.allUsers && now - lastFetchTime.allUsers < minInterval)
    ) {
      return;
    }
    
    // Clear any existing timer
    if (allUsersDebounceTimer.current) {
      clearTimeout(allUsersDebounceTimer.current);
    }
    
    // Set up a debounced call
    allUsersDebounceTimer.current = setTimeout(async () => {
      try {
        if (isOffline() && allUsers.length > 0) {
          console.log('Offline: Using cached all users data');
          return;
        }
        
        setAllUsersFetchStatus('loading');
        const data = await getAllUsers();
        setAllUsers(data);
        setLastFetchTime(prev => ({ ...prev, allUsers: Date.now() }));
        setAllUsersFetchStatus('success');
      } catch (error) {
        console.error('Error fetching all users:', error);
        setAllUsersFetchStatus('error');
      }
    }, debounceMs);
    
  }, [debounceMs, allUsersFetchStatus, lastFetchTime, allUsers.length]);
  
  // Initial prefetch
  useEffect(() => {
    fetchTopUsers();
    
    if (prefetchAllUsers) {
      fetchAllUsers();
    }
    
    // Setup regular refresh intervals when tab is visible
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isOffline()) {
        fetchTopUsers(prefetchCount, false);
        
        if (prefetchAllUsers) {
          fetchAllUsers(false);
        }
      }
    }, 60000); // Refresh every minute if tab is visible
    
    return () => {
      clearInterval(refreshInterval);
      if (topUsersDebounceTimer.current) clearTimeout(topUsersDebounceTimer.current);
      if (allUsersDebounceTimer.current) clearTimeout(allUsersDebounceTimer.current);
    };
  }, [fetchTopUsers, fetchAllUsers, prefetchAllUsers, prefetchCount]);
  
  // Handle visibility change to optimize data fetching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isOffline()) {
        // When tab becomes visible, refresh data if it's been a while
        const now = Date.now();
        
        if (!lastFetchTime.topUsers || now - lastFetchTime.topUsers > 120000) { // 2 min
          fetchTopUsers(prefetchCount, false);
        }
        
        if (prefetchAllUsers && (!lastFetchTime.allUsers || now - lastFetchTime.allUsers > 300000)) { // 5 min
          fetchAllUsers(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchTopUsers, fetchAllUsers, prefetchAllUsers, lastFetchTime, prefetchCount]);
  
  return {
    topUsers,
    allUsers,
    topUsersFetchStatus,
    allUsersFetchStatus,
    fetchTopUsers,
    fetchAllUsers
  };
}; 