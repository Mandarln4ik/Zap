import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import api from '../services/api';
import { generateKeyPair } from '../services/encryption';

export const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const setUser = useChatStore(state => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        // При регистрации генерируем ключи E2EE
        const keys = await generateKeyPair();
        // Сохраняем приватный ключ локально (в жизни лучше использовать IndexedDB или защищенное хранилище)
        localStorage.setItem(`priv_key_${username}`, keys.privateKey);
        
        await api.post('/auth/register', { 
          username, 
          password, 
          displayName, 
          publicKey: keys.publicKey 
        });
        setIsRegister(false);
        alert('Registration successful! Please login.');
      } else {
        const { data } = await api.post('/auth/login', { username, password });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
        window.location.href = '/';
      }
    } catch (error) {
      alert(isRegister ? 'Registration failed' : 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Zap Messenger</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          {isRegister && (
            <input
              type="text"
              placeholder="Display Name"
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 font-bold hover:underline"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};
