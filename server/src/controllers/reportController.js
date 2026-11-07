import { db } from '../database/db.js';
import { logAudit } from '../utils/logger.js';

export async function createReport(req, res, next) {
  try {
    const {
      reportedUserId,
      reportedItemId,
      rentalId,
      reportType,
      description,
      evidenceUrls
    } = req.body;

    if (!reportType || !description) {
      return res.status(400).json({ error: 'Report type and detailed description are required.' });
    }

    const report = await db.insert('reports', {
      reporter_id: req.user.id,
      reported_user_id: reportedUserId || null,
      reported_item_id: reportedItemId || null,
      rental_id: rentalId || null,
      report_type: reportType,
      description: description.trim(),
      evidence_urls: evidenceUrls || null,
      status: 'pending'
    });

    // Notify admins
    const admins = await db.find('users', { role: 'admin' });
    for (const admin of admins) {
      await db.insert('notifications', {
        user_id: admin.id,
        title: 'New User Concern Reported',
        message: `A new ${reportType} report was submitted by ${req.user.fullName}.`,
        type: 'report_created',
        link_url: '/admin/reports',
        is_read: false
      });
    }

    await logAudit({
      actorId: req.user.id,
      action: 'REPORT_FILED',
      targetEntity: 'REPORTS',
      targetId: report.id,
      details: { reportType, reportedUserId, reportedItemId, rentalId }
    });

    res.status(201).json({
      message: 'Your report has been submitted to trust & safety administrators for investigation.',
      report
    });
  } catch (err) {
    next(err);
  }
}
