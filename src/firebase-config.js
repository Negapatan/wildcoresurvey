import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signOut, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
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

// Function to test Firestore connectivity
export const testFirestoreConnection = async () => {
  try {
    console.log("Testing Firestore connection...");
    const testRef = collection(db, 'sections');
    const snapshot = await getDocs(testRef);
    console.log("Firestore connection successful. Documents count:", snapshot.size);
    console.log("Firestore connection successful. Documents empty:", snapshot.empty);
    
    snapshot.forEach(doc => {
      console.log("Document ID:", doc.id);
    });
    
    return {
      success: true,
      count: snapshot.size,
      isEmpty: snapshot.empty
    };
  } catch (error) {
    console.error("Firestore connection test failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Email sign-in successful:", user);
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error("Email sign-in failed:", error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Function to handle anonymous authentication with retries
const authenticateAnonymously = async (maxRetries = 3) => {
  // Skip anonymous auth if there's a signed-in user
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    console.log('User already signed in, skipping anonymous auth');
    return;
  }
  
  const tryAuth = async () => {
    try {
      await signInAnonymously(auth);
      console.log('Anonymous auth successful');
      
      // Test Firestore connection after successful authentication
      const connectionTest = await testFirestoreConnection();
      console.log("Firestore connection test result:", connectionTest);
      
      return true;
    } catch (error) {
      console.error('Anonymous auth error:', error);
      return false;
    }
  };
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const success = await tryAuth();
    if (success) return;
    
    console.log(`Retrying anonymous authentication (${attempt + 1}/${maxRetries})...`);
    
    // Wait before retrying (exponential backoff)
    const delay = 1000 * Math.pow(2, attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  console.error(`Failed to authenticate anonymously after ${maxRetries} attempts`);
};

// Start anonymous authentication
authenticateAnonymously();

// Function to get current user data
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Function to check if user is an adviser
export const checkUserRole = async (uid) => {
  try {
    // Get the user document directly using the UID as the document ID
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      console.log('User document not found for uid:', uid);
      return { role: null };
    }
    
    const userData = userDoc.data();
    console.log('User data found:', userData);
    
    return { 
      role: userData.role,
      userData: {
        ...userData,
        uid: uid  // Ensure uid is included
      }
    };
  } catch (error) {
    console.error('Error checking user role:', error);
    return { error: error.message };
  }
};

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser doesn\'t support all of the features required to enable persistence');
    }
  });

// Add a function to sign out the current user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
    // Try to sign in anonymously again after signing out
    await authenticateAnonymously();
  } catch (error) {
    console.error('Error signing out or re-authenticating:', error);
  }
};

export default app; 