import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useChatStore } from './store/useChatStore';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';

const App = () => {
  const { user, initSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && user) {
      initSocket(token);
    }
    return () => disconnectSocket();
  }, [user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={user ? <ChatPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
