import webPush from 'web-push';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../services/prisma';

// В .env должны быть VAPID ключи
// generateVAPIDKeys() можно использовать для создания

export const subscribe = async (req: AuthRequest, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = req.userId!;

    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    res.status(201).json({ message: 'Subscribed to push notifications' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

export const sendPushNotification = async (userId: string, title: string, body: string) => {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  
  const payload = JSON.stringify({ title, body });

  subscriptions.forEach(sub => {
    const pushConfig = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh
      }
    };

    webPush.sendNotification(pushConfig, payload).catch(err => {
      if (err.statusCode === 410) {
        // Подписка больше не валидна
        prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    });
  });
};
