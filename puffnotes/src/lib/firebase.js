// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: This safely parses the environment variable
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Add required scopes for Google Drive API
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.appdata');


export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;

    // The credential contains the all-important OAuth access token
    // which we will need for Google Drive API calls.
    const accessToken = credential.accessToken;

    return { user, accessToken };
  } catch (error) {
    console.error("Google Sign-In Error", error);
    // Handle specific errors if needed, e.g., popup closed by user
    return { user: null, accessToken: null };
  }
};

export const signOut = () => {
  return firebaseSignOut(auth);
};

export { auth, db };