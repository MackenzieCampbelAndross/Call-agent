import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi, getStoredToken, clearStoredToken } from '../api/client';
import { AdminUser } from '@call-agent/shared';

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      adminApi
        .getCurrentUser()
        .then(user => {
          if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
            setAdmin(user);
          } else {
            clearStoredToken();
            setAdmin(null);
          }
        })
        .catch(() => {
          clearStoredToken();
          setAdmin(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const user = await adminApi.login(email, password);
    setAdmin(user);
  };

  const logout = () => {
    clearStoredToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
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
