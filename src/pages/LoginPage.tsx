import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthError } from '../types';

const LoginPage: React.FC = () => {
  const { signInWithGoogle, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/popup-closed-by-user') {
        setError('Login Cancelled');
      } else {
        setError('Login Error');
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#F9FAFB',
      padding: '1rem'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#111827', 
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Chatties
        </h1>
        <p style={{ 
          color: '#4B5563', 
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Start chatting with Google account.
        </p>
        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#3B82F6',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
         
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage; 