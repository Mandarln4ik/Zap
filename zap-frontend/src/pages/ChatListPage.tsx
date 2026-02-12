import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Chat } from '../types';
import { formatDistanceToNowStrict } from 'date-fns';
import './ChatListPage.css';
import { LogOut } from 'lucide-react';

const ChatListPage: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get('/chats');
        setChats(response.data);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
        // Handle error, e.g., redirect to login if unauthorized
      }
    };
    fetchChats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="chat-list-page">
      <header className="chat-list-header">
        <h2>Chats</h2>
        <button onClick={handleLogout} className="logout-button">
          <LogOut size={20} />
        </button>
      </header>
      <div className="chat-list">
        {chats.map((chat) => (
          <div key={chat.id} className="chat-card" onClick={() => navigate(`/chat/${chat.id}`)}>
            <div className="chat-avatar">
              {chat.isGroup ? '👥' : chat.participants[0]?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="chat-info">
              <div className="chat-name">
                {chat.isGroup ? chat.name : chat.participants[0]?.username}
              </div>
              {chat.messages.length > 0 && (
                <div className="last-message">
                  {chat.messages[0]?.content.substring(0, 30)}...
                </div>
              )}
            </div>
            {chat.messages.length > 0 && (
              <div className="message-time">
                {formatDistanceToNowStrict(new Date(chat.messages[0].createdAt), { addSuffix: true })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatListPage;
