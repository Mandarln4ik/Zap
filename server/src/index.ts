import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // В продакшене ограничить
    methods: ["GET", "POST"]
  }
});

app.use(helmet({
  crossOriginResourcePolicy: false, // Чтобы можно было загружать медиа
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes placeholder
app.get('/', (req, res) => {
  res.send('Zap Messenger API is running');
});

// Socket.io basic setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
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
