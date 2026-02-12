import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { User } from '../types';
import './ProfilePage.css';
import { ArrowLeft, Camera, Edit } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get<User>('/users/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Optionally redirect to login if unauthorized
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={24} />
        </button>
      </header>

      <div className="profile-info-card">
        <button className="edit-profile-button">
          <Edit size={20} />
        </button>
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="edit-avatar-icon">
            <Camera size={20} />
          </div>
        </div>
        <h2 className="profile-username">{user.username}</h2>
        <p className="profile-login">@{user.login}</p>

        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">ID</span>
            <span className="detail-value">{user.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Created At</span>
            <span className="detail-value">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
