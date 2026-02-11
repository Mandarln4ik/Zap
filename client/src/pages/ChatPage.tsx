import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import api from '../services/api';
import { decryptMessage, encryptMessage } from '../services/encryption';

export const ChatPage = () => {
  const { user, socket, currentChat, setCurrentChat, chats, setChats } = useChatStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const privateKey = user ? localStorage.getItem(`priv_key_${user.username}`) : null;

  useEffect(() => {
    const fetchChats = async () => {
      const { data } = await api.get('/chats');
      setChats(data);
    };
    fetchChats();
  }, []);

  useEffect(() => {
    if (currentChat) {
      const fetchMessages = async () => {
        const { data } = await api.get(`/chats/${currentChat.id}/messages`);
        const decrypted = await Promise.all(data.map(async (m: any) => ({
          ...m,
          content: (m.type === 'text' && privateKey) ? await decryptMessage(m.content, privateKey) : m.content
        })));
        setMessages(decrypted);
      };
      fetchMessages();
      socket?.emit('join_chat', currentChat.id);
    }
  }, [currentChat]);

  useEffect(() => {
    if (!socket) return;
    const handler = async (msg: any) => {
      if (msg.chatId === currentChat?.id) {
        const decrypted = {
          ...msg,
          content: (msg.type === 'text' && privateKey) ? await decryptMessage(msg.content, privateKey) : msg.content
        };
        setMessages(prev => [...prev, decrypted]);
      }
    };
    socket.on('new_message', handler);
    return () => { socket.off('new_message', handler); };
  }, [socket, currentChat, privateKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      const { data } = await api.get(`/users/search?query=${q}`);
      setSearchResults(data);
    } else {
      setSearchResults([]);
    }
  };

  const startChat = async (otherUser: any) => {
    const { data } = await api.post('/chats', { 
      participantIds: [otherUser.id],
      isGroup: false 
    });
    setCurrentChat({ ...data, otherUser });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChat || !user) return;

    // Находим публичный ключ получателя
    const otherParticipant = currentChat.participants.find((p: any) => p.userId !== user.id);
    const recipientPublicKey = otherParticipant?.user.publicKey;

    let encrypted = message;
    if (recipientPublicKey) {
      encrypted = await encryptMessage(message, recipientPublicKey);
    }

    socket?.emit('send_message', {
      chatId: currentChat.id,
      senderId: user.id,
      content: encrypted,
      type: 'text'
    });
    setMessage('');
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${currentChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 border-r`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Chats</h2>
            <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden">
               {user?.avatarUrl && <img src={user.avatarUrl} alt="Avatar" />}
            </div>
          </div>
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full p-2 bg-gray-100 rounded-lg outline-none"
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 bg-white shadow-lg rounded-lg mt-1 w-72">
              {searchResults.map(u => (
                <div 
                  key={u.id} 
                  onClick={() => startChat(u)}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                >
                  {u.displayName || u.username}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => {
            const otherUser = chat.participants.find((p: any) => p.userId !== user?.id)?.user;
            return (
              <div 
                key={chat.id} 
                onClick={() => setCurrentChat(chat)}
                className={`p-4 cursor-pointer hover:bg-gray-100 flex items-center space-x-3 ${currentChat?.id === chat.id ? 'bg-blue-50' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0">
                  {otherUser?.avatarUrl && <img src={otherUser.avatarUrl} className="rounded-full" />}
                </div>
                <div className="flex-1 truncate">
                  <div className="font-semibold text-gray-900">{chat.isGroup ? chat.name : (otherUser?.displayName || otherUser?.username || 'Chat')}</div>
                  <div className="text-sm text-gray-500 truncate">{chat.messages?.[0]?.content || 'No messages'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!currentChat ? 'hidden' : 'flex'} flex-1 flex-col h-full bg-gray-50`}>
        {currentChat ? (
          <>
            <div className="p-4 border-b bg-white flex items-center">
              <button onClick={() => setCurrentChat(null)} className="md:hidden mr-3">←</button>
              <div className="font-bold">{currentChat.isGroup ? currentChat.name : (currentChat.participants.find((p: any) => p.userId !== user?.id)?.user.displayName || 'Chat')}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl ${m.senderId === user?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none shadow-sm'}`}>
                    {m.type === 'text' && <div>{m.content}</div>}
                    {m.type === 'image' && <img src={m.fileUrl} className="rounded-lg max-w-full" alt="media" />}
                    <div className="text-[10px] mt-1 opacity-70 text-right">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex space-x-2">
              <input 
                type="text" 
                className="flex-1 p-2 border rounded-full outline-none focus:border-blue-500 px-4" 
                placeholder="Message"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <button className="bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center">
                ➤
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};
