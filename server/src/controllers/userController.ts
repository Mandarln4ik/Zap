import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../services/prisma';

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const userId = req.userId!;

    const user = await prisma.user.update({
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query as string, mode: 'insensitive' } },
          { displayName: { contains: query as string, mode: 'insensitive' } }
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
