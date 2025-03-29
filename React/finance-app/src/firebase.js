// Import Firebase v9 modules correctly
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { firebaseConfig } from './config';

// Add verbose logging
console.log('Firebase initialization starting...');
console.log('Config being used:', JSON.stringify(firebaseConfig));

let app, auth, db;

try {
  // Initialize Firebase
  app = firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
  auth = firebase.auth();
  db = firebase.firestore();
  console.log('Auth and Firestore services created');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { app, firebase, auth, db };
export default app;
