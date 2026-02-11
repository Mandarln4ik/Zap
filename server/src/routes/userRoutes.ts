import { Router } from 'express';
import { uploadFile, updateProfile, searchUsers } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/storage';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.patch('/profile', updateProfile);
router.post('/upload', upload.single('file'), uploadFile);

export default router;
