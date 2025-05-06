import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  limit,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Update rate limit timestamp for a user and specific action type
export const updateRateLimitTimestamp = async (actionType: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    const userId = user.uid;
    const rateLimitRef = doc(db, 'rateLimits', userId);
    
    // Check if the rate limit document exists
    const rateLimitDoc = await getDoc(rateLimitRef);
    
    if (!rateLimitDoc.exists()) {
      // Create a new rate limit document if it doesn't exist
      await setDoc(rateLimitRef, {
        [actionType]: serverTimestamp(),
      });
    } else {
      // Update the existing document with the new timestamp
      await updateDoc(rateLimitRef, {
        [actionType]: serverTimestamp(),
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating rate limit timestamp:', error);
    return false;
  }
};

// IP-based rate limiting for profile submissions
// Used to prevent multiple profile creations from the same IP address
export const checkIPProfileRateLimit = async (ip: string): Promise<{ allowed: boolean, timeRemaining?: number }> => {
  try {
    // Using a hashed IP to avoid storing actual IP addresses
    const hashedIP = await hashIP(ip);
    
    // Reference to the IP rate limits collection
    const ipLimitRef = doc(db, 'ipRateLimits', hashedIP);
    
    // Check if this IP has submitted profiles before
    const ipDoc = await getDoc(ipLimitRef);
    
    // Profile submission limits
    const PROFILE_LIMIT = 2; // Maximum number of profiles per time period
    const COOLDOWN_HOURS = 24; // Time period in hours

    if (ipDoc.exists()) {
      const data = ipDoc.data();
      const lastSubmission = data.lastSubmission?.toDate() || new Date(0);
      const submissionCount = data.count || 0;
      
      // Check if it's been more than the cooldown period since the first submission
      const now = new Date();
      const hoursSinceLastSubmission = (now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSubmission < COOLDOWN_HOURS) {
        // Still within cooldown period
        if (submissionCount >= PROFILE_LIMIT) {
          // Limit reached, calculate time remaining
          const timeRemaining = COOLDOWN_HOURS - hoursSinceLastSubmission;
          return { 
            allowed: false, 
            timeRemaining: Math.ceil(timeRemaining)
          };
        } else {
          // Under limit, update count and allow
          await updateDoc(ipLimitRef, {
            count: submissionCount + 1,
            lastSubmission: serverTimestamp()
          });
          return { allowed: true };
        }
      } else {
        // Cooldown period expired, reset counter
        await setDoc(ipLimitRef, {
          count: 1,
          lastSubmission: serverTimestamp()
        });
        return { allowed: true };
      }
    } else {
      // First submission from this IP
      await setDoc(ipLimitRef, {
        count: 1,
        lastSubmission: serverTimestamp()
      });
      return { allowed: true };
    }
  } catch (error) {
    console.error('Error checking IP rate limit:', error);
    // Default to allowing in case of error (failsafe)
    return { allowed: true };
  }
};

// Simple hash function to avoid storing raw IP addresses
async function hashIP(ip: string): Promise<string> {
  // Using a simple hash here - in a real app, you'd want a more secure approach
  // This is just to avoid storing raw IPs while still being able to track them
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'mlbb-collector-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
