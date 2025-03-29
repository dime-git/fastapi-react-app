import React, { useEffect, useRef, useState } from 'react';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { auth, firebase } from '../firebase';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// Create a global instance of AuthUI to prevent deletion issues
let globalAuthUI = null;

const FirebaseAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen to auth state changes
    const unregisterAuthObserver = auth.onAuthStateChanged((currentUser) => {
      setIsSignedIn(!!currentUser);
      setUser(currentUser);

      // If user is logged in, redirect to dashboard
      if (currentUser) {
        navigate('/');
      } else if (containerRef.current) {
        // If user is logged out, reinitialize the UI
        initFirebaseAuthUI();
      }
    });

    // Initialize the FirebaseUI Widget
    initFirebaseAuthUI();

    // Cleanup subscription on unmount
    return () => {
      unregisterAuthObserver();
      // Don't delete the UI instance on unmount
      // Just stop the UI if container exists
      if (globalAuthUI && containerRef.current) {
        globalAuthUI.reset();
      }
    };
  }, [navigate]);

  const initFirebaseAuthUI = () => {
    // Initialize the FirebaseUI Widget using Firebase
    try {
      // Use the global AuthUI instance if it exists
      if (!globalAuthUI) {
        globalAuthUI = new firebaseui.auth.AuthUI(auth);
      }

      const uiConfig = {
        // Popup signin flow rather than redirect flow
        signInFlow: 'popup',
        // Redirect handled in onAuthStateChanged
        signInSuccessUrl: '/',
        // We will display Google authentication as the primary method
        signInOptions: [
          {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            customParameters: {
              prompt: 'select_account',
            },
          },
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
        ],
        // Terms of service url
        tosUrl: 'https://example.com/terms-of-service',
        // Privacy policy url
        privacyPolicyUrl: 'https://example.com/privacy-policy',
        callbacks: {
          // Handle redirect in our code
          signInSuccessWithAuthResult: () => false,
        },
      };

      if (containerRef.current) {
        // Reset before starting to prevent multiple UI instances
        globalAuthUI.reset();
        globalAuthUI.start(containerRef.current, uiConfig);
      }
    } catch (error) {
      console.error('Error initializing FirebaseUI:', error);
      setError('Failed to load authentication UI. Please try again later.');
    }
  };

  // If already signed in, immediately redirect
  if (isSignedIn) {
    navigate('/');
    return null;
  }

  return (
    <div className='auth-container'>
      <h2>Login to Your Account</h2>
      <p>Please sign in to continue to the app</p>
      {error && <div className='alert alert-danger'>{error}</div>}
      <div ref={containerRef} id='firebaseui-auth-container'></div>
    </div>
  );
};

export default FirebaseAuth;
