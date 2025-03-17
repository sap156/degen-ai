
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state if authentication is still being checked
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Allow access to Dashboard (Index) page without authentication
  if (location.pathname === '/') {
    return <>{children}</>;
  }
  
  // Redirect to login if not authenticated for other routes
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Render the protected content if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
