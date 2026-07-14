import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    if (token) {
      try {
        const data = await fetchApi('/auth/me');
        if (data) {
          setUser(data);
        } else {
          // Token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('cloudToken');
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to load user', e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    // Call API here
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: 'Invalid response' };
    } catch (e) {
      return { success: false, message: e.message || 'Server unreachable' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cloudToken');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleAuthError = () => logout();
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, reloadUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
