import express from 'express';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, upload.single('avatar'), updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;

