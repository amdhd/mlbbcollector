import { db } from './firebase';
import { UserProfile } from '../../types/mlbb';
import { updateRateLimitTimestamp, checkIPProfileRateLimit } from './firebaseUtils';
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
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';

const COLLECTION_NAME = 'mlbbUsers';

// Trim and length-cap a user-supplied string before it is persisted.
const cleanStr = (value: unknown, maxLength: number): string =>
  (value == null ? '' : String(value)).trim().slice(0, maxLength);

// Coerce a user-supplied numeric field to a non-negative finite number.
const clampNum = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Normalize/limit user-supplied profile fields before writing to Firestore.
const sanitizeProfile = (profile: UserProfile): UserProfile => ({
  ...profile,
  name: cleanStr(profile.name, 60),
  region: cleanStr(profile.region, 40),
  playerId: cleanStr(profile.playerId, 40),
  seasonJoined: cleanStr(profile.seasonJoined, 20),
  profileImageUrl: cleanStr(profile.profileImageUrl, 1000),
  totalPoints: clampNum(profile.totalPoints),
  accountWorth: clampNum(profile.accountWorth),
  diamondValue: clampNum(profile.diamondValue),
  rmValue: clampNum(profile.rmValue),
});

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
const convertToUserProfile = (
  doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): UserProfile => {
  const data = doc.data() || {};
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

// Add or update user profile with IP rate limiting
export const saveUserProfile = async (profileInput: UserProfile, clientIP?: string): Promise<string> => {
  try {
    // Trim/length-cap strings and clamp numeric fields before any read/write.
    const profile = sanitizeProfile(profileInput);

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
    
    // Ensure collection exists
    await ensureCollection();
    
    const userQuery = query(
      collection(db, COLLECTION_NAME),
      where('playerId', '==', playerId)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      console.log('No user found with playerId:', playerId);
      return null;
    }
    
    console.log('User found with playerId:', playerId);
    return convertToUserProfile(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error getting user by playerId:', error);
    return null;
  }
};

// Get user by document ID
export const getUserById = async (id: string): Promise<UserProfile | null> => {
  try {
    if (!id) return null;
    
    // Ensure collection exists
    await ensureCollection();
    
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('No user found with id:', id);
      return null;
    }
    
    console.log('User found with id:', id);
    return convertToUserProfile(docSnap);
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
};

// Get top users by total points
export const getTopUsers = async (count: number = 30): Promise<UserProfile[]> => {
  try {
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
    return users;
  } catch (error) {
    console.error('Error getting top users by region:', error);
    return [];
  }
};

// Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    // Ensure collection exists
    await ensureCollection();
    
    const usersQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('totalPoints', 'desc')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    const users = querySnapshot.docs.map(convertToUserProfile);
    console.log(`Retrieved ${users.length} users total`);
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}; 