"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.updateProfile = exports.uploadFile = void 0;
const prisma_1 = __importDefault(require("../services/prisma"));
const uploadFile = async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file uploaded' });
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimetype: req.file.mimetype
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.uploadFile = uploadFile;
const updateProfile = async (req, res) => {
    try {
        const { displayName, avatarUrl } = req.body;
        const userId = req.userId;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { displayName, avatarUrl },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
            }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProfile = updateProfile;
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query)
            return res.json([]);
        const users = await prisma_1.default.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { displayName: { contains: query, mode: 'insensitive' } }
                ],
                NOT: { id: req.userId }
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
            },
            take: 10
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.searchUsers = searchUsers;
