'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({ email: payload.sub, roles: payload.roles || [] });
      } else {
        Cookies.remove('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const token = res.data.data.token;
    Cookies.set('token', token, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    const payload = parseJwt(token);
    setUser({ email: payload.sub, roles: payload.roles || [] });
    return token;
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
