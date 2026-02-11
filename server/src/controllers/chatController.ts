import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../services/prisma';

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const chats = await prisma.chat.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const { participantIds, name, isGroup } = req.body;
    const userId = req.userId!;

    // Для личного чата (isGroup: false) проверяем, существует ли он уже
    if (!isGroup && participantIds.length === 1) {
      const otherUserId = participantIds[0];
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: otherUserId } } }
          ]
        }
      });
      if (existingChat) return res.json(existingChat);
    }

    const chat = await prisma.chat.create({
      data: {
        name,
        isGroup: !!isGroup,
        participants: {
          create: [
            { userId },
            ...participantIds.map((id: string) => ({ userId: id }))
          ]
        }
      }
    });

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { cursor } = req.query; // Для пагинации

    const messages = await prisma.message.findMany({
      where: { chatId },
      take: 50,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor as string } : undefined,
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
