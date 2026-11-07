import express from 'express';
import { createReview } from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createReview);

export default router;

