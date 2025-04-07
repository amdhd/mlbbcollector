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
export const uploadFile = async (file: File, path: string) => {
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
