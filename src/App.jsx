import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import FieldUser from './pages/FieldUser';
import AdminDashboard from './pages/AdminDashboard';

function RootRedirect() {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/user" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="w-screen h-screen bg-background text-white overflow-hidden">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/user" element={
              <ProtectedRoute roleRequired="field">
                <FieldUser />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute roleRequired="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
