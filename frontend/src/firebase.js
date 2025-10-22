import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBh5ET8InC-485lsXIwoeyMOpNlwHMTEB0",
  authDomain: "fightmatch-45bf4.firebaseapp.com",
  projectId: "fightmatch-45bf4",
  storageBucket: "fightmatch-45bf4.firebasestorage.app",
  messagingSenderId: "897012307107",
  appId: "1:897012307107:web:ccdfc963cf572a1ae05b16",
  measurementId: "G-WKBYC9BL4T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ EXPORT THESE (they were missing!)
export const db = getFirestore(app);
export const storage = getStorage(app);