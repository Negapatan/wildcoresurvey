import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLrJcUISHH2UVKeT88cT3uHN0tpTp5Dx0",
  authDomain: "wildcore-88292.firebaseapp.com",
  databaseURL: "https://wildcore-88292-default-rtdb.firebaseio.com",
  projectId: "wildcore-88292",
  storageBucket: "wildcore-88292.firebasestorage.app",
  messagingSenderId: "380042176463",
  appId: "1:380042176463:web:9cb282817911239b4754ba",
  measurementId: "G-C3C9JETKK3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable anonymous authentication
signInAnonymously(auth)
  .then(() => {
    console.log('Anonymous auth successful');
  })
  .catch((error) => {
    console.error('Anonymous auth error:', error);
  });

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser doesn\'t support all of the features required to enable persistence');
    }
  });

export default app; 