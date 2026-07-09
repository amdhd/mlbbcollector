import { db } from './firebase';
import { UserProfile } from '../../types/mlbb';
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
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';

// This module is the "data access layer": every read/write to the leaderboard
// goes through these functions, so the UI never talks to Firestore directly.
//
// NOTE: The live deployment freezes the leaderboard as read-only (see
// firestore.rules — `allow write: if false`). The write functions below still
// work against your own Firebase project when you enable writes locally.

// Name of the Firestore collection that stores every player's profile.
const COLLECTION_NAME = 'mlbbUsers';

// Trim and length-cap a user-supplied string before it is persisted. This stops
// oversized or padded input from ever reaching the database.
const cleanStr = (value: unknown, maxLength: number): string =>
  (value == null ? '' : String(value)).trim().slice(0, maxLength);

// Coerce a user-supplied numeric field to a non-negative finite number, so a
// malformed value (NaN, negative, Infinity) can never be stored.
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

// Convert a raw Firestore document into a fully-formed UserProfile. Firestore
// returns loosely-typed data, so we default every field here to guarantee the
// rest of the app always receives a complete, predictable object.
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
    // Firestore timestamps need `.toMillis()` to become plain numbers; fall
    // back to "now" for older documents that predate these fields.
    createdAt: data.createdAt?.toMillis() || Date.now(),
    updatedAt: data.updatedAt?.toMillis() || Date.now()
  };
};

// Create a new profile, or update the existing one if this playerId is already
// registered. Returns the Firestore document id of the saved profile.
export const saveUserProfile = async (profileInput: UserProfile): Promise<string> => {
  try {
    // Always clean/clamp the input first, so nothing unvalidated is written.
    const profile = sanitizeProfile(profileInput);

    // "Upsert": if a profile with this playerId exists, update it in place
    // instead of creating a duplicate.
    if (profile.playerId) {
      const existingUser = await getUserByPlayerId(profile.playerId);

      if (existingUser) {
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
          // Let the server set the time so it isn't affected by a wrong clock
          // on the user's device.
          updatedAt: serverTimestamp()
        });
        return existingUser.id!;
      }
    }

    // No existing profile — create a brand new document.
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving user profile:', error);
    // Re-throw so the UI can decide how to tell the user about the failure.
    throw error;
  }
};

// Look up a single profile by the player's in-game id. Returns null if no
// player has that id (or on error, so the UI can treat it as "not found").
export const getUserByPlayerId = async (playerId: string): Promise<UserProfile | null> => {
  try {
    if (!playerId) return null;

    const userQuery = query(
      collection(db, COLLECTION_NAME),
      where('playerId', '==', playerId)
    );

    const querySnapshot = await getDocs(userQuery);
    if (querySnapshot.empty) return null;

    return convertToUserProfile(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error getting user by playerId:', error);
    return null;
  }
};

// Fetch the highest-scoring players for the global leaderboard. `count` caps
// how many rows are returned so we never download the whole collection.
export const getTopUsers = async (count: number = 30): Promise<UserProfile[]> => {
  try {
    const topUsersQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('totalPoints', 'desc'),
      limit(count)
    );

    const querySnapshot = await getDocs(topUsersQuery);
    return querySnapshot.docs.map(convertToUserProfile);
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
};

// Same as getTopUsers, but limited to a single region. Requires the composite
// (region, totalPoints) index defined in firestore.indexes.json.
export const getTopUsersByRegion = async (region: string, count: number = 30): Promise<UserProfile[]> => {
  try {
    if (!region) return [];

    const topUsersQuery = query(
      collection(db, COLLECTION_NAME),
      where('region', '==', region),
      orderBy('totalPoints', 'desc'),
      limit(count)
    );

    const querySnapshot = await getDocs(topUsersQuery);
    return querySnapshot.docs.map(convertToUserProfile);
  } catch (error) {
    console.error('Error getting top users by region:', error);
    return [];
  }
};

// Fetch every player, sorted by score. Used to work out a user's exact rank and
// percentile against the whole population (see mlbbUtils). This reads the full
// collection, so it's only suitable while the dataset stays small.
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('totalPoints', 'desc')
    );

    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.map(convertToUserProfile);
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};
