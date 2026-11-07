import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
  getItemBookedDates
} from '../controllers/itemController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getItems);
router.get('/my/listings', authenticateToken, getMyItems);
router.get('/:id', getItemById);
router.get('/:id/booked-dates', getItemBookedDates);

router.post('/', authenticateToken, upload.array('images', 8), createItem);
router.put('/:id', authenticateToken, upload.array('images', 8), updateItem);
router.delete('/:id', authenticateToken, deleteItem);

export default router;
