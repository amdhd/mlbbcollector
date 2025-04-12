import { db } from './firebase';
import { UserProfile } from '../../types/mlbb';
import { updateRateLimitTimestamp, checkIPProfileRateLimit, isOffline, getAdjustedCacheTTL } from './firebaseUtils';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

const COLLECTION_NAME = 'mlbbUsers';

// Cache configuration
const CACHE_EXPIRY = {
  TOP_USERS: 5 * 60 * 1000, // 5 minutes in milliseconds
  ALL_USERS: 10 * 60 * 1000, // 10 minutes in milliseconds
  USER_PROFILE: 15 * 60 * 1000 // 15 minutes in milliseconds
};

// In-memory cache
const memoryCache = {
  topUsers: { data: null as UserProfile[] | null, timestamp: 0, region: null as string | null, count: 0 },
  allUsers: { data: null as UserProfile[] | null, timestamp: 0 },
  userProfiles: new Map<string, { data: UserProfile | null, timestamp: number }>()
};

// Helper to ensure the collection exists
const ensureCollection = async () => {
  try {
    // Try to get documents from the collection - this will create it if it doesn't exist
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    console.log(`Collection ${COLLECTION_NAME} exists or was created`);
    return true;
  } catch (error) {
    console.error(`Error accessing collection ${COLLECTION_NAME}:`, error);
    return false;
  }
};

// Convert Firestore data to UserProfile
const convertToUserProfile = (doc: QueryDocumentSnapshot<DocumentData>): UserProfile => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    region: data.region || '',
    playerId: data.playerId || '',
    seasonJoined: data.seasonJoined || '',
    profileImageUrl: data.profileImageUrl || '',
    collectionPoints: data.collectionPoints || {
      supreme: 0,
      grand: 0,
      exquisite: 0,
      deluxe: 0,
      exceptional: 0,
      common: 0,
      painted: 0
    },
    totalPoints: data.totalPoints || 0,
    accountWorth: data.accountWorth || 0,
    diamondValue: data.diamondValue || 0,
    rmValue: data.rmValue || 0,
    percentile: data.percentile || 0,
    rank: data.rank || 0,
    createdAt: data.createdAt?.toMillis() || Date.now(),
    updatedAt: data.updatedAt?.toMillis() || Date.now()
  };
};

// Cache helpers
const setLocalStorageWithExpiry = (key: string, value: any, ttl: number) => {
  // Adjust TTL based on network status
  const adjustedTTL = getAdjustedCacheTTL(ttl);
  
  const item = {
    value,
    expiry: Date.now() + adjustedTTL
  };
  localStorage.setItem(key, JSON.stringify(item));
};

const getLocalStorageWithExpiry = (key: string) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    if (!item.expiry || Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (error) {
    localStorage.removeItem(key);
    return null;
  }
};

// Cache invalidation helper - call this after any data mutation
const invalidateCache = (userId?: string) => {
  // Clear in-memory cache
  memoryCache.topUsers.data = null;
  memoryCache.allUsers.data = null;
  
  // Clear localStorage cache
  localStorage.removeItem('mlbb_topUsers');
  localStorage.removeItem('mlbb_allUsers');
  
  // If a specific user was updated, clear just their cache
  if (userId) {
    memoryCache.userProfiles.delete(userId);
    localStorage.removeItem(`mlbb_user_${userId}`);
  }
};

// Add or update user profile with IP rate limiting
export const saveUserProfile = async (profile: UserProfile, clientIP?: string): Promise<string> => {
  try {
    // Check IP rate limits if the clientIP is provided and this appears to be a new profile
    if (clientIP && !profile.id) {
      const ipCheck = await checkIPProfileRateLimit(clientIP);
      if (!ipCheck.allowed) {
        throw new Error(`Profile submission limit reached. Please try again in ${ipCheck.timeRemaining} hours.`);
      }
    }
    
    // First update the rate limit timestamp
    const rateLimitUpdated = await updateRateLimitTimestamp('profiles');
    if (!rateLimitUpdated) {
      console.warn('Rate limit tracking failed, but continuing with save operation');
    }
    
    // Ensure collection exists
    await ensureCollection();
    
    // Check if user already exists
    if (profile.playerId) {
      const existingUser = await getUserByPlayerId(profile.playerId);
      
      if (existingUser) {
        // Update existing user
        await updateDoc(doc(db, COLLECTION_NAME, existingUser.id!), {
          name: profile.name,
          region: profile.region,
          playerId: profile.playerId,
          seasonJoined: profile.seasonJoined,
          profileImageUrl: profile.profileImageUrl,
          collectionPoints: profile.collectionPoints,
          totalPoints: profile.totalPoints,
          accountWorth: profile.accountWorth,
          diamondValue: profile.diamondValue,
          rmValue: profile.rmValue,
          updatedAt: serverTimestamp()
        });
        
        // Invalidate cache for this user
        invalidateCache(existingUser.id);
        
        console.log('User profile updated successfully');
        return existingUser.id!;
      }
    }
    
    // Add new user
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Invalidate caches since we added a new user
    invalidateCache();
    
    console.log('User profile created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error; // Rethrow so we can handle specific errors in the UI
  }
};

// Get user by player ID
export const getUserByPlayerId = async (playerId: string): Promise<UserProfile | null> => {
  try {
    if (!playerId) return null;
    
    // Check in-memory cache for recent queries by this playerId
    const cacheKey = `playerId_${playerId}`;
    if (memoryCache.userProfiles.has(cacheKey)) {
      const cached = memoryCache.userProfiles.get(cacheKey);
      if (cached && cached.timestamp > Date.now() - CACHE_EXPIRY.USER_PROFILE) {
        console.log('Using cached user data for playerId:', playerId);
        return cached.data;
      }
    }
    
    // Check localStorage cache
    const localData = getLocalStorageWithExpiry(`mlbb_user_playerId_${playerId}`);
    if (localData) {
      console.log('Using localStorage cached data for playerId:', playerId);
      // Update in-memory cache
      memoryCache.userProfiles.set(cacheKey, {
        data: localData,
        timestamp: Date.now()
      });
      return localData;
    }
    
    // Ensure collection exists
    await ensureCollection();
    
    const userQuery = query(
      collection(db, COLLECTION_NAME),
      where('playerId', '==', playerId)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      console.log('No user found with playerId:', playerId);
      // Cache the null result too
      memoryCache.userProfiles.set(cacheKey, {
        data: null,
        timestamp: Date.now()
      });
      return null;
    }
    
    const userData = convertToUserProfile(querySnapshot.docs[0]);
    console.log('User found with playerId:', playerId);
    
    // Update caches
    memoryCache.userProfiles.set(cacheKey, {
      data: userData,
      timestamp: Date.now()
    });
    
    if (userData.id) {
      memoryCache.userProfiles.set(userData.id, {
        data: userData,
        timestamp: Date.now()
      });
      setLocalStorageWithExpiry(`mlbb_user_${userData.id}`, userData, CACHE_EXPIRY.USER_PROFILE);
    }
    
    setLocalStorageWithExpiry(`mlbb_user_playerId_${playerId}`, userData, CACHE_EXPIRY.USER_PROFILE);
    
    return userData;
  } catch (error) {
    console.error('Error getting user by playerId:', error);
    return null;
  }
};

// Get user by document ID
export const getUserById = async (id: string): Promise<UserProfile | null> => {
  try {
    if (!id) return null;
    
    // Check in-memory cache
    if (memoryCache.userProfiles.has(id)) {
      const cached = memoryCache.userProfiles.get(id);
      if (cached && cached.timestamp > Date.now() - CACHE_EXPIRY.USER_PROFILE) {
        console.log('Using cached user data for id:', id);
        return cached.data;
      }
    }
    
    // Check localStorage cache
    const localData = getLocalStorageWithExpiry(`mlbb_user_${id}`);
    if (localData) {
      console.log('Using localStorage cached data for id:', id);
      // Update in-memory cache
      memoryCache.userProfiles.set(id, {
        data: localData,
        timestamp: Date.now()
      });
      return localData;
    }
    
    // Ensure collection exists
    await ensureCollection();
    
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('No user found with id:', id);
      // Cache the null result
      memoryCache.userProfiles.set(id, {
        data: null,
        timestamp: Date.now()
      });
      return null;
    }
    
    const userData = {
      id: docSnap.id,
      ...docSnap.data()
    } as UserProfile;
    
    console.log('User found with id:', id);
    
    // Update caches
    memoryCache.userProfiles.set(id, {
      data: userData,
      timestamp: Date.now()
    });
    setLocalStorageWithExpiry(`mlbb_user_${id}`, userData, CACHE_EXPIRY.USER_PROFILE);
    
    return userData;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
};

// Get top users by total points
export const getTopUsers = async (count: number = 30): Promise<UserProfile[]> => {
  try {
    // Check in-memory cache first
    if (
      memoryCache.topUsers.data &&
      memoryCache.topUsers.timestamp > Date.now() - CACHE_EXPIRY.TOP_USERS &&
      memoryCache.topUsers.count >= count
    ) {
      console.log('Using cached top users data');
      return (memoryCache.topUsers.data as UserProfile[]).slice(0, count);
    }
    
    // Check localStorage cache
    const localData = getLocalStorageWithExpiry('mlbb_topUsers');
    if (localData && localData.length >= count) {
      console.log('Using localStorage cached data for top users');
      // Update in-memory cache
      memoryCache.topUsers = {
        data: localData,
        timestamp: Date.now(),
        region: null,
        count
      };
      return localData.slice(0, count);
    }
    
    // Ensure collection exists
    await ensureCollection();
    
    const topUsersQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('totalPoints', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(topUsersQuery);
    
    const users = querySnapshot.docs.map(convertToUserProfile);
    console.log(`Retrieved ${users.length} top users`);
    
    // Update caches
    memoryCache.topUsers = {
      data: users,
      timestamp: Date.now(),
      region: null,
      count
    };
    setLocalStorageWithExpiry('mlbb_topUsers', users, CACHE_EXPIRY.TOP_USERS);
    
    return users;
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
};

// Get top users by region
export const getTopUsersByRegion = async (region: string, count: number = 30): Promise<UserProfile[]> => {
  try {
    if (!region) return [];
    
    // Check in-memory cache first for this specific region
    if (
      memoryCache.topUsers.data &&
      memoryCache.topUsers.timestamp > Date.now() - CACHE_EXPIRY.TOP_USERS &&
      memoryCache.topUsers.region === region &&
      memoryCache.topUsers.count >= count
    ) {
      console.log('Using cached top users data for region:', region);
      return (memoryCache.topUsers.data as UserProfile[]).slice(0, count);
    }
    
    // Check localStorage cache
    const cacheKey = `mlbb_topUsers_${region}`;
    const localData = getLocalStorageWithExpiry(cacheKey);
    if (localData && localData.length >= count) {
      console.log('Using localStorage cached data for top users in region:', region);
      // Update in-memory cache
      memoryCache.topUsers = {
        data: localData,
        timestamp: Date.now(),
        region,
        count
      };
      return localData.slice(0, count);
    }
    
    // Ensure collection exists
    await ensureCollection();
    
    const topUsersQuery = query(
      collection(db, COLLECTION_NAME),
      where('region', '==', region),
      orderBy('totalPoints', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(topUsersQuery);
    
    const users = querySnapshot.docs.map(convertToUserProfile);
    console.log(`Retrieved ${users.length} top users from region:`, region);
    
    // Update caches
    memoryCache.topUsers = {
      data: users,
      timestamp: Date.now(),
      region,
      count
    };
    setLocalStorageWithExpiry(cacheKey, users, CACHE_EXPIRY.TOP_USERS);
    
    return users;
  } catch (error) {
    console.error('Error getting top users by region:', error);
    return [];
  }
};

// Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    // Check in-memory cache first
    if (
      memoryCache.allUsers.data &&
      memoryCache.allUsers.timestamp > Date.now() - CACHE_EXPIRY.ALL_USERS
    ) {
      console.log('Using cached all users data');
      return memoryCache.allUsers.data as UserProfile[];
    }
    
    // Check localStorage cache
    const localData = getLocalStorageWithExpiry('mlbb_allUsers');
    if (localData) {
      console.log('Using localStorage cached data for all users');
      // Update in-memory cache
      memoryCache.allUsers = {
        data: localData,
        timestamp: Date.now()
      };
      return localData;
    }
    
    // Ensure collection exists
    await ensureCollection();
    
    const usersQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('totalPoints', 'desc')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    const users = querySnapshot.docs.map(convertToUserProfile);
    console.log(`Retrieved ${users.length} users total`);
    
    // Update caches
    memoryCache.allUsers = {
      data: users,
      timestamp: Date.now()
    };
    setLocalStorageWithExpiry('mlbb_allUsers', users, CACHE_EXPIRY.ALL_USERS);
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}; 