// Import Firebase v9 modules correctly
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { firebaseConfig } from './config';

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
