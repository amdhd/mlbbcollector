import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Upload a file (e.g. a profile image) to Firebase Storage and return a public
// URL that can be shown with an <img> tag.
//
// `path` is where the file is stored inside the bucket, for example
// "profile-images/abc123.png".
export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
