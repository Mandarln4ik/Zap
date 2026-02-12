"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = exports.subscribe = void 0;
const web_push_1 = __importDefault(require("web-push"));
const prisma_1 = __importDefault(require("../services/prisma"));
// В .env должны быть VAPID ключи
// generateVAPIDKeys() можно использовать для создания
const subscribe = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.userId;
        await prisma_1.default.pushSubscription.create({
            data: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        });
        res.status(201).json({ message: 'Subscribed to push notifications' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to subscribe' });
    }
};
exports.subscribe = subscribe;
const sendPushNotification = async (userId, title, body) => {
    const subscriptions = await prisma_1.default.pushSubscription.findMany({ where: { userId } });
    const payload = JSON.stringify({ title, body });
    subscriptions.forEach(sub => {
        const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
                auth: sub.auth,
                p256dh: sub.p256dh
            }
        };
        web_push_1.default.sendNotification(pushConfig, payload).catch(err => {
            if (err.statusCode === 410) {
                // Подписка больше не валидна
                prisma_1.default.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
            }
        });
    });
};
exports.sendPushNotification = sendPushNotification;
