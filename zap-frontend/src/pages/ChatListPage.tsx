import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import api from '../api/axios';
import { Chat, User } from '../types';
import { formatDistanceToNowStrict } from 'date-fns';
import './ChatListPage.css';
import { LogOut, User as UserIcon, Search as SearchIcon } from 'lucide-react';
import ChatPage from './ChatPage';
import debounce from 'lodash/debounce';

const ChatListPage: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { id: activeChatId } = useParams<{ id: string }>();

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const searchUsers = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    try {
      setIsSearching(true);
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((nextValue: string) => searchUsers(nextValue), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const startPrivateChat = async (targetUser: User) => {
    try {
      const response = await api.post(`/chats/private/${targetUser.id}`);
      const chat = response.data;
      setSearchQuery("");
      setSearchResults([]);
      navigate(`/chat/${chat.id}`, { state: { chat } }); // Передаем объект чата через state
      fetchChats();
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) return chat.name;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.username || 'Unknown';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) return '👥';
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.username?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="chat-list-page">
      <div className={`side-bar ${activeChatId ? 'hidden-mobile' : ''}`}>
        <header className="chat-list-header">
          <div className="header-top">
            <button onClick={() => navigate('/profile')} className="profile-button">
              <UserIcon size={24} />
            </button>
            <h2>Zap</h2>
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={20} />
            </button>
          </div>
          <div className="search-container">
            <SearchIcon className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by @id..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(user => (
                  <div key={user.id} className="search-result-item" onClick={() => startPrivateChat(user)}>
                    <div className="chat-avatar" style={{ width: 40, height: 40, fontSize: '1rem', marginRight: 10 }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-info">
                      <div className="chat-name">{user.username}</div>
                      <div className="last-message">@{user.login}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-card ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <div className="chat-avatar">
                {getChatAvatar(chat)}
              </div>
              <div className="chat-info">
                <div className="chat-name-row">
                  <div className="chat-name">{getChatName(chat)}</div>
                  {chat.messages.length > 0 && (
                    <div className="message-time">
                      {formatDistanceToNowStrict(new Date(chat.messages[0].createdAt), { addSuffix: false })}
                    </div>
                  )}
                </div>
                {chat.messages.length > 0 && (
                  <div className="last-message">
                    {chat.messages[0]?.content}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className={`main-content ${activeChatId ? 'visible-mobile' : ''}`}>
        <Routes>
          <Route path="chat/:id" element={<ChatPage />} />
          <Route path="*" element={<div className="no-chat-selected">Select a chat to start messaging</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default ChatListPage;
