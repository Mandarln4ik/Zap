import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma';

const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, displayName, publicKey } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        displayName,
        publicKey
      }
    });

    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRES });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET!);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.session.create({
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const session = await prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const accessToken = jwt.sign({ userId: payload.userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRES });

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};
