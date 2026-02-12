import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { User } from '../types';
import './LoginPage.css';

interface LoginPageProps {
  setUser?: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setUser }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [login, setLogin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const url = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { login, username, password } : { login, password };
      const response = await api.post(url, payload);
      localStorage.setItem('token', response.data.access_token);
      if (setUser) {
        setUser(response.data.user);
      }
      navigate('/chats');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login">Login:</label>
            <input
              type="text"
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>
          {isRegister && (
            <div className="input-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}
          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-button">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <button
          className="toggle-button"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? 'Already have an account? Login'
            : 'Don\'t have an account? Register'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
