import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import prisma from './services/prisma';

import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_chats', (chatIds: string[]) => {
    chatIds.forEach(id => socket.join(id));
  });

  socket.on('send_message', async (data) => {
    const { chatId, senderId, content, type, fileUrl, fileName, fileSize } = data;
    
    try {
      const message = await prisma.message.create({
        data: {
          chatId,
          senderId,
          content,
          type: type || 'text',
          fileUrl,
          fileName,
          fileSize,
          isEncrypted: true
        },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true }
          }
        }
      });

      io.to(chatId).emit('new_message', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { io };
