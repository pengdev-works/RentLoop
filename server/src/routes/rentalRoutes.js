import express from 'express';
import {
  createRentalRequest,
  getRenterRequests,
  getOwnerRequests,
  approveRequest,
  rejectRequest,
  cancelRequest,
  getRentalById,
  confirmHandover,
  confirmReturn
} from '../controllers/rentalController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/requests', authenticateToken, createRentalRequest);
router.get('/my/renter-requests', authenticateToken, getRenterRequests);
router.get('/my/owner-requests', authenticateToken, getOwnerRequests);

router.put('/requests/:id/approve', authenticateToken, approveRequest);
router.put('/requests/:id/reject', authenticateToken, rejectRequest);
router.put('/requests/:id/cancel', authenticateToken, cancelRequest);

router.get('/:id', authenticateToken, getRentalById);
router.post('/:id/handover', authenticateToken, confirmHandover);
router.post('/:id/return', authenticateToken, confirmReturn);

export default router;
