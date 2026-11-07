import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('rentloop_token');
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch {
          // Stale, reset or expired token - clean up quietly
          localStorage.removeItem('rentloop_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('rentloop_token', data.token);
    const fullUser = await api.getMe();
    setUser(fullUser);
    return fullUser;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('rentloop_token', data.token);
    const fullUser = await api.getMe();
    setUser(fullUser);
    return fullUser;
  };

  const logout = () => {
    localStorage.removeItem('rentloop_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const updated = await api.getMe();
      setUser(updated);
      return updated;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isVerified: user?.verification?.status === 'verified'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

