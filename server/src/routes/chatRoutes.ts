import { Router } from 'express';
import { getChats, createChat, getMessages } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getChats);
router.post('/', createChat);
router.get('/:chatId/messages', getMessages);

export default router;
