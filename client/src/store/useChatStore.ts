import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface ChatState {
  user: User | null;
  chats: any[];
  currentChat: any | null;
  socket: Socket | null;
  setUser: (user: User | null) => void;
  setChats: (chats: any[]) => void;
  setCurrentChat: (chat: any | null) => void;
  initSocket: (token: string) => void;
  disconnectSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  chats: [],
  currentChat: null,
  socket: null,

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setChats: (chats) => set({ chats }),
  
  setCurrentChat: (currentChat) => set({ currentChat }),

  initSocket: (token) => {
    if (get().socket) return;
    
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Connected to socket');
    });

    set({ socket });
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null });
  }
}));
