import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On first load (or refresh), if a token is saved, verify it's
  // still valid by asking the backend who it belongs to.
  useEffect(() => {
    const savedToken = localStorage.getItem('token');

    if (!savedToken) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((response) => {
        setUser(response.data);
        setToken(savedToken);
      })
      .catch(() => {
        // Token expired or invalid — clear it out.
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (loginResponse) => {
    // loginResponse is exactly what POST /auth/login returns:
    // { token, user: { user_id, full_name, email, role, must_change_password } }
    localStorage.setItem('token', loginResponse.token);
    setToken(loginResponse.token);
    setUser(loginResponse.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Used by the password-change prompt to clear the flag locally
  // once the user changes or keeps their password, without a full reload.
  const clearMustChangePassword = () => {
    setUser((prev) => (prev ? { ...prev, must_change_password: false } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, clearMustChangePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}