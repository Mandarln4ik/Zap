"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("./services/prisma"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/chats', chatRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
// Socket.io
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join_chats', (chatIds) => {
        chatIds.forEach(id => socket.join(id));
    });
    socket.on('send_message', async (data) => {
        const { chatId, senderId, content, type, fileUrl, fileName, fileSize } = data;
        try {
            const message = await prisma_1.default.message.create({
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
        }
        catch (error) {
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
