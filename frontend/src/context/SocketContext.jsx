import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { SOCKET_URL, API_URL } from '../config';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null); // prevent multiple connections
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.id) return;

    const configuredUrl = (SOCKET_URL || API_URL || '').trim();
    const socketUrl = configuredUrl.replace(/\/+$/, ''); // ✅ FIXED regex

    if (!socketUrl) {
      console.warn('Socket URL not configured. Set VITE_SOCKET_URL or VITE_API_URL.');
      return;
    }

    console.log('SOCKET_URL:', socketUrl);

    // Prevent duplicate socket connections
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io(socketUrl, {
      transports: ['websocket'], // ✅ more reliable
      withCredentials: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connected
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('register', user.id);
    });

    // Notification listener
    newSocket.on('notification', (payload) => {
      toast(payload.message, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    });

    // Error handling
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};