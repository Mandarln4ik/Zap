import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { Chat, Message, User } from '../types';
import { sendMessage, joinChat, subscribeToMessages } from '../api/socket';
import { format } from 'date-fns';
import { ArrowLeft, Send, Paperclip, Video, Mic, Circle } from 'lucide-react';
import './ChatPage.css';
import { MessageType } from '../utils/enums';

const ChatPage: React.FC = () => {
  const { id: chatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // State to manage visibility on mobile
  const [isChatVisible, setIsChatVisible] = useState(false);

  useEffect(() => {
    if (chatId) {
      setIsChatVisible(true);
    } else {
      setIsChatVisible(false);
    }
  }, [chatId]);

  useEffect(() => {
    const fetchChatData = async () => {
      if (!chatId) return;
      try {
        const chatResponse = await api.get<Chat>(`/chats/${chatId}`);
        setChat(chatResponse.data);
        const messagesResponse = await api.get<Message[]>(`/chats/${chatId}/messages`);
        setMessages(messagesResponse.data);

        let userProfile = JSON.parse(localStorage.getItem("user") || "{}");
        if (!userProfile || !userProfile.id) {
          userProfile = (await api.get<User>("/users/profile")).data;
          localStorage.setItem("user", JSON.stringify(userProfile));
        }
        setCurrentUser(userProfile);

        joinChat(chatId);
        subscribeToMessages((err, msg) => {
          if (msg.chat.id === chatId) {
            setMessages((prevMessages) => [...prevMessages, msg]);
          }
        });
      } catch (error) {
        console.error("Failed to fetch chat data:", error);
      }
    };

    fetchChatData();

    return () => {
      // Disconnect socket or remove listeners if necessary
    };
  }, [chatId, location.pathname]); // Re-run when chatId or path changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && currentUser && chatId) {
      sendMessage({
        chatId,
        senderId: currentUser.id,
        content: newMessage,
        type: MessageType.TEXT,
      });
      setNewMessage('');
    }
  };

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case MessageType.TEXT:
        return <p>{message.content}</p>;
      case MessageType.IMAGE:
        return <img src={message.fileUrl} alt="Image" style={{ maxWidth: '200px' }} />;
      case MessageType.VIDEO:
        return (
          <video controls src={message.fileUrl} style={{ maxWidth: '200px' }} />
        );
      case MessageType.AUDIO:
        return <audio controls src={message.fileUrl} />;
      case MessageType.FILE:
        return (
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
            Download File
          </a>
        );
      case MessageType.CIRCLE:
        return (
          <video
            autoPlay
            loop
            muted
            playsInline
            src={message.fileUrl}
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
          />
        );
      default:
        return <p>{message.content}</p>;
    }
  };

  if (!chat) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className={`chat-page ${isChatVisible ? "visible-mobile" : ""}`}>
      <header className="chat-header">
        <button onClick={() => navigate("/chats")} className="back-button mobile-only">
          <ArrowLeft size={24} />
        </button>
        <h2>{chat.isGroup ? chat.name : chat.participants.find(p => p.id !== currentUser?.id)?.username}</h2>
        {/* Add chat settings/info button here if needed */}
      </header>
      <div className="messages-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-bubble ${message.sender.id === currentUser?.id ? 'sent' : 'received'}`}
          >
            <div className="message-sender-avatar">
              {message.sender.username.charAt(0).toUpperCase()}
            </div>
            <div className="message-content-wrapper">
              <span className="message-sender-name">
                {message.sender.username}
              </span>
              {renderMessageContent(message)}
              <span className="message-timestamp">
                {format(new Date(message.createdAt), 'p')}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input-area">
        <button className="attachment-button">
          <Paperclip size={24} />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => (e.key === 'Enter' ? handleSendMessage() : null)}
        />
        <button onClick={handleSendMessage} className="send-button">
          <Send size={24} />
        </button>
        <button className="media-button">
          <Mic size={24} />
        </button>
        <button className="media-button">
          <Video size={24} />
        </button>
        <button className="media-button">
          <Circle size={24} />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
