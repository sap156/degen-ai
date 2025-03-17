
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state if authentication is still being checked
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("No user found, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render the protected content if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
