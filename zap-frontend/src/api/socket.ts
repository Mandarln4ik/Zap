import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initiateSocketConnection = () => {
  socket = io(process.env.REACT_APP_API_URL || window.location.origin, {
    path: '/api/socket.io',
  });
  console.log(`Connecting socket...`);
};

export const disconnectSocket = () => {
  console.log('Disconnecting socket...');
  if (socket) socket.disconnect();
};

export const subscribeToMessages = (cb: (err: any, msg: any) => void) => {
  if (!socket) return;
  socket.on('newMessage', (msg: any) => {
    console.log('Websocket event received!');
    return cb(null, msg);
  });
};

export const sendMessage = (data: any) => {
  if (socket) socket.emit('sendMessage', data);
};

export const joinChat = (chatId: string) => {
  if (socket) socket.emit('joinChat', chatId);
};
