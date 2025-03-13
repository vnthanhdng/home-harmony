import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    // Get token from localStorage or your auth context
    const token = localStorage.getItem('token');
    return !!token; // Return true if token exists
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    // Save the location they were trying to access for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;