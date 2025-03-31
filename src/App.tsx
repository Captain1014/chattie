import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import LoginPage from './pages/LoginPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import PrivateRoute from './components/PrivateRoute';

const App: React.FC = () => {
  return (
    <div style={{
      backgroundColor: '#F3F4F6',
      minHeight: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      <Router>
        <AuthProvider>
          <ChatProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <ChatListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/chat/:id"
                element={
                  <PrivateRoute>
                    <ChatRoomPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </Router>
    </div>
  );
};

export default App;
