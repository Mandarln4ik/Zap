"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.login = exports.register = void 0;
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../services/prisma"));
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;
const register = async (req, res) => {
    try {
        const { username, password, displayName, publicKey } = req.body;
        const existingUser = await prisma_1.default.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        const passwordHash = await argon2_1.default.hash(password);
        const user = await prisma_1.default.user.create({
            data: {
                username,
                passwordHash,
                displayName,
                publicKey
            }
        });
        res.status(201).json({ message: 'User created', userId: user.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { username } });
        if (!user || !(await argon2_1.default.verify(user.passwordHash, password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
        await prisma_1.default.session.create({
            data: {
                userId: user.id,
                refreshToken,
                expiresAt
            }
        });
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                publicKey: user.publicKey
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(401).json({ error: 'Refresh token required' });
    try {
        const session = await prisma_1.default.session.findUnique({ where: { refreshToken } });
        if (!session || session.expiresAt < new Date()) {
            return res.status(403).json({ error: 'Invalid or expired refresh token' });
        }
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const accessToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
        res.json({ accessToken });
    }
    catch (error) {
        res.status(403).json({ error: 'Invalid refresh token' });
    }
};
exports.refresh = refresh;
