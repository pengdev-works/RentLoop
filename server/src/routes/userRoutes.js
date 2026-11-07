import express from 'express';
import { submitIdentityVerification, getPublicUserProfile } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post(
  '/verify-identity',
  authenticateToken,
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 }
  ]),
  submitIdentityVerification
);

router.get('/:id/public-profile', getPublicUserProfile);

export default router;
