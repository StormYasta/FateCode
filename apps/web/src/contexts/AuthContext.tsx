import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
  avatarUrl?: string | null;
  bio?: string | null;
  profile?: {
    totalXP: number;
    githubUsername?: string | null;
    codewarsUsername?: string | null;
    preferredLanguage?: string;
  };
  streak?: {
    currentStreak: number;
    maxStreak: number;
  };
  classMemberships?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fatecode_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fatecode_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const freshUser = response.data.user;
      setUser(freshUser);
      localStorage.setItem('fatecode_user', JSON.stringify(freshUser));
    } catch (err) {
      console.error('Failed to fetch user:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('fatecode_token', newToken);
    localStorage.setItem('fatecode_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('fatecode_token');
    localStorage.removeItem('fatecode_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
