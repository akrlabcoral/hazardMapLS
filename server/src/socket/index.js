/**
 * server/src/socket/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Socket.IO manager.
 * Handles client connection, disconnection, and room subscriptions.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Server } from 'socket.io';
import { startFeed, stopFeed } from './feedGenerator.js';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Welcome handshake
    socket.emit('simulation:update', { message: 'HazardMap real-time channel established.' });

    // Handle feed requests directly via socket (hybrid approach)
    socket.on('feed:start', (payload) => {
      startFeed(payload, io);
    });

    socket.on('feed:stop', () => {
      stopFeed();
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}
