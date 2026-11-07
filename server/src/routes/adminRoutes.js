import express from 'express';
import {
  getAdminDashboardStats,
  getAllUsers,
  updateUserStatus,
  getVerifications,
  reviewVerification,
  getAllRentalsAdmin,
  getReportsAdmin,
  resolveReportAdmin,
  getAuditLogs
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/verifications', getVerifications);
router.put('/verifications/:id/review', reviewVerification);
router.get('/rentals', getAllRentalsAdmin);
router.get('/reports', getReportsAdmin);
router.put('/reports/:id/resolve', resolveReportAdmin);
router.get('/audit-logs', getAuditLogs);

export default router;

