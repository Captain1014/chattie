import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          width: '3rem', 
          height: '3rem', 
          border: '2px solid #E5E7EB', 
          borderTop: '2px solid #3B82F6', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default PrivateRoute; 