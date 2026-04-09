let io;

/**
 * Socket.IO mapping logic.
 * Simple map to keep track of connected users:
 * userId -> socketId
 */
const connectedUsers = new Map();

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: '*', // We allow all origins for development, can restrict to frontend URL later
        methods: ['GET', 'POST', 'PUT']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('register', (userId) => {
        if (userId) {
          connectedUsers.set(userId, socket.id);
          console.log(`User ${userId} registered socket ${socket.id}`);
        }
      });

      socket.on('disconnect', () => {
        // Find and remove the mapping on disconnect
        for (const [userId, socketId] of connectedUsers.entries()) {
          if (socketId === socket.id) {
            connectedUsers.delete(userId);
            break;
          }
        }
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },

  /**
   * Helper to emit a notification to a specific user
   * @param {String} userId 
   * @param {Object} payload 
   */
  emitNotification: (userId, payload) => {
    if (!io) return;
    const stringId = userId.toString();
    const socketId = connectedUsers.get(stringId);
    if (socketId) {
      io.to(socketId).emit('notification', payload);
    }
  }
};
