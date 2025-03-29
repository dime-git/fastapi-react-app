import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const PrivateRoute = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        const isAuthenticated = !!user;
        setAuthenticated(isAuthenticated);
        setLoading(false);

        // If user is not authenticated, redirect to login page
        if (!isAuthenticated && !loading) {
          navigate('/login', { replace: true });
        }
      });

      return unsubscribe;
    };

    // Add a short delay to prevent redirection loops
    const timeout = setTimeout(checkAuth, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [navigate, loading]);

  if (loading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: '100vh' }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  return authenticated ? <Outlet /> : <Navigate to='/login' replace />;
};

export default PrivateRoute;
