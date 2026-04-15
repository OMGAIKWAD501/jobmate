import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ VERY IMPORTANT (for session)
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      axios.get(`${API_URL}/api/auth/profile`)
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ LOGIN FIXED
  const login = async (email, password) => {
    try {
      const res = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",   // 🔥 FIXED
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",  // 🔥 REQUIRED FOR SESSION
          body: JSON.stringify({ email, password })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message };
      }

      // ✅ SAVE TOKEN (IMPORTANT)
      if (data.token) {
        localStorage.setItem('token', data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }

      setUser(data.user);

      return { success: true };

    } catch (error) {
      return { success: false, message: "Server error" };
    }
  };

  // ✅ REGISTER
  const register = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, userData);

      const { token, user: newUser } = res.data;

      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      setUser(newUser);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};