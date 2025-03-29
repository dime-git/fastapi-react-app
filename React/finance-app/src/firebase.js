// Import Firebase v9 modules correctly
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCcvMmyk7qAP8ycxnJwXQcZYsXduN7qu2A',
  authDomain: 'finance-app-7a318.firebaseapp.com',
  projectId: 'finance-app-7a318',
  storageBucket: 'finance-app-7a318.firebasestorage.app',
  messagingSenderId: '1072828197012',
  appId: '1:1072828197012:web:9a0a9c5ff4128069792c81',
  measurementId: 'G-QW56YMMYY9',
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();

export { app, firebase };
export default app;
