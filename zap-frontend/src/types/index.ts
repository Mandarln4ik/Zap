export interface User {
  id: string;
  login: string;
  username: string;
  password?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'audio' | 'video' | 'file' | 'circle' | 'image';
  fileUrl?: string;
  sender: User;
  createdAt: string;
}

export interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: User[];
  messages: Message[];
  updatedAt: string;
}
