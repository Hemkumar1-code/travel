import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, roleRequired }) {
  const { currentUser, userRole, loading } = useAuth();

  // Still checking auth state - show nothing
  if (loading) {
    return <div className="w-screen h-screen bg-background" />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If role is still loading (null), default to 'field' for field users
  const resolvedRole = userRole || 'field';

  if (roleRequired && resolvedRole !== roleRequired) {
    if (resolvedRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/user" replace />;
    }
  }

  return children;
}
