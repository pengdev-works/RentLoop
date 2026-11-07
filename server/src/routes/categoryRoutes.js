import express from 'express';
import { getCategories, getAllCategoriesAdmin, createCategory, updateCategory } from '../controllers/categoryController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/all', authenticateToken, requireRole('admin'), getAllCategoriesAdmin);
router.post('/', authenticateToken, requireRole('admin'), createCategory);
router.put('/:id', authenticateToken, requireRole('admin'), updateCategory);

export default router;
