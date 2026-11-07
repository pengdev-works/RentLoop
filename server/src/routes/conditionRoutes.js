import express from 'express';
import { submitConditionReport, verifyConditionReport } from '../controllers/conditionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/reports', authenticateToken, upload.array('photos', 6), submitConditionReport);
router.put('/reports/:id/verify', authenticateToken, verifyConditionReport);

export default router;

