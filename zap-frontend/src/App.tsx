import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatListPage from './pages/ChatListPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import { initiateSocketConnection, disconnectSocket } from './api/socket';
import api from './api/axios';
import { User } from './types';

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        setUser(response.data);
        initiateSocketConnection();
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      disconnectSocket();
    };
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginPage setUser={setUser} />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <AuthWrapper>
              <Routes>
                <Route path="/chats" element={<ChatListPage />} />
                <Route path="/chat/:id" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<ChatListPage />} />
              </Routes>
            </AuthWrapper>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
