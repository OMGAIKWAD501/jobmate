import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const { user } = useAuth(); // AuthContext gives us access to logged-in user

  useEffect(() => {
    let newSocket;

    if (user && user.id) {
      const configuredUrl = (SOCKET_URL || API_URL).trim();
      const socketUrl = configuredUrl ? configuredUrl.replace(/\/+$, '') : '';

      if (!socketUrl) {
        console.warn('Socket URL not configured. Set VITE_SOCKET_URL or VITE_API_URL.');
        return;
      }

      console.log('SOCKET_URL:', socketUrl);
      // Connect to Socket.io server
      newSocket = io(socketUrl);

      setSocket(newSocket);

      newSocket.on('connect', () => {
        // Register this client as the specific user immediately upon connect
        newSocket.emit('register', user.id);
      });

      newSocket.on('notification', (payload) => {
        // Pop a toast anywhere in the app!
        toast(payload.message, {
          icon: '🔔',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      });
    }

    // Cleanup when component unmounts or user logs out
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
