import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

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
      // Connect to Socket.io server
      newSocket = io(window.location.origin.replace('3000', '5000').split(':5000')[0] + ':5000'); 
      // Hardcodes typical port swap for dev environments, connects to backend port 5000

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
