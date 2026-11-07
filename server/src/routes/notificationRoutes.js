import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.put('/mark-all-read', authenticateToken, markAllAsRead);
router.put('/:id/read', authenticateToken, markAsRead);
router.delete('/:id', authenticateToken, deleteNotification);

export default router;

