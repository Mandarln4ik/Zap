"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = exports.createChat = exports.getChats = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const getChats = async (req, res) => {
    try {
        const userId = req.userId;
        const chats = await prisma_1.default.chat.findMany({
            where: {
                participants: {
                    some: { userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true
                            }
                        }
                    }
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        res.json(chats);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getChats = getChats;
const createChat = async (req, res) => {
    try {
        const { participantIds, name, isGroup } = req.body;
        const userId = req.userId;
        // Для личного чата (isGroup: false) проверяем, существует ли он уже
        if (!isGroup && participantIds.length === 1) {
            const otherUserId = participantIds[0];
            const existingChat = await prisma_1.default.chat.findFirst({
                where: {
                    isGroup: false,
                    AND: [
                        { participants: { some: { userId } } },
                        { participants: { some: { userId: otherUserId } } }
                    ]
                }
            });
            if (existingChat)
                return res.json(existingChat);
        }
        const chat = await prisma_1.default.chat.create({
            data: {
                name,
                isGroup: !!isGroup,
                participants: {
                    create: [
                        { userId },
                        ...participantIds.map((id) => ({ userId: id }))
                    ]
                }
            }
        });
        res.status(201).json(chat);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createChat = createChat;
const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { cursor } = req.query; // Для пагинации
        const messages = await prisma_1.default.message.findMany({
            where: { chatId },
            take: 50,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            }
        });
        res.json(messages.reverse());
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getMessages = getMessages;
