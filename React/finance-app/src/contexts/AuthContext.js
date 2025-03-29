import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../firebase';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sign up function
  async function signup(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Add display name to the user
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }

      // Send email verification
      await sendEmailVerification(userCredential.user);

      return userCredential.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Login with Google
  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    try {
      await signOut(auth);
      setError('');
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Reset password function
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      setError('');
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Update profile function
  async function updateUserProfile(displayName, photoURL) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName || auth.currentUser.displayName,
        photoURL: photoURL || auth.currentUser.photoURL,
      });
      setError('');
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Update email function
  async function updateUserEmail(email) {
    try {
      await updateEmail(auth.currentUser, email);
      setError('');
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Update password function
  async function updateUserPassword(password) {
    try {
      await updatePassword(auth.currentUser, password);
      setError('');
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Effect to handle auth state changes
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Values to be provided by the context
  const value = {
    currentUser,
    error,
    setError,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
