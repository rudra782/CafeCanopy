import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket || !socket.connected) {
    const token = localStorage.getItem('accessToken');
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => console.log('[Socket] Connected:', socket?.id));
    socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export default getSocket;
