import { db } from '../database/db.js';
import { logAudit } from '../utils/logger.js';

export async function getAdminDashboardStats(req, res, next) {
  try {
    const totalUsers = await db.count('users');
    const totalVerified = await db.count('identity_verifications', { status: 'verified' });
    const pendingVerifications = await db.count('identity_verifications', { status: 'pending' });

    const totalItems = await db.count('items');
    const availableItems = await db.count('items', { status: 'active', is_available: true });

    const pendingRequests = await db.count('rental_requests', { status: 'pending' });
    const activeRentals = await db.count('rentals', { status: 'active' });
    const completedRentals = await db.count('rentals', { status: 'completed' });
    const disputedRentals = await db.count('rentals', { status: 'disputed' });

    const pendingReports = await db.count('reports', { status: 'pending' });

    // Recent activity audit logs
    const recentLogs = await db.find('audit_logs', {}, { orderBy: 'created_at', orderDirection: 'desc', limit: 10 });
    const users = await db.find('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));

    const populatedLogs = recentLogs.map(log => ({
      ...log,
      actorName: log.actor_id ? userMap[log.actor_id] || 'System' : 'System'
    }));

    res.json({
      metrics: {
        totalUsers,
        totalVerified,
        pendingVerifications,
        totalItems,
        availableItems,
        pendingRequests,
        activeRentals,
        completedRentals,
        disputedRentals,
        pendingReports
      },
      recentLogs: populatedLogs
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllUsers(req, res, next) {
  try {
    const users = await db.find('users', {}, { orderBy: 'created_at', orderDirection: 'desc' });
    const profiles = await db.find('user_profiles');
    const verifications = await db.find('identity_verifications');

    const profMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));
    const verMap = Object.fromEntries(verifications.map(v => [v.user_id, v]));

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
      profile: profMap[u.id] || {},
      verificationStatus: verMap[u.id]?.status || 'unverified'
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const user = await db.findOne('users', { id });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updates = {};
    if (status && ['active', 'suspended', 'pending_review'].includes(status)) {
      updates.status = status;
    }
    if (role && ['user', 'admin'].includes(role)) {
      updates.role = role;
    }

    await db.update('users', { id }, updates);

    await logAudit({
      actorId: req.user.id,
      action: 'ADMIN_USER_UPDATED',
      targetEntity: 'USERS',
      targetId: id,
      details: updates
    });

    res.json({ message: 'User updated successfully.', updates });
  } catch (err) {
    next(err);
  }
}

export async function getVerifications(req, res, next) {
  try {
    const { status } = req.query;
    const conditions = {};
    if (status && status !== 'all') {
      conditions.status = status;
    }

    const verifications = await db.find('identity_verifications', conditions, {
      orderBy: 'submitted_at',
      orderDirection: 'desc'
    });

    const users = await db.find('users');
    const profiles = await db.find('user_profiles');
    const uMap = Object.fromEntries(users.map(u => [u.id, u]));
    const pMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

    const populated = verifications.map(v => ({
      ...v,
      user: {
        id: v.user_id,
        email: uMap[v.user_id]?.email,
        fullName: uMap[v.user_id]?.full_name,
        phone: uMap[v.user_id]?.phone,
        avatarUrl: pMap[v.user_id]?.avatar_url
      }
    }));

    res.json(populated);
  } catch (err) {
    next(err);
  }
}

export async function reviewVerification(req, res, next) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "verified" or "rejected".' });
    }

    const verification = await db.findOne('identity_verifications', { id });
    if (!verification) {
      return res.status(404).json({ error: 'Verification submission not found.' });
    }

    const now = new Date().toISOString();
    await db.update('identity_verifications', { id }, {
      status,
      rejection_reason: status === 'rejected' ? (rejectionReason || 'Documents could not be verified.') : null,
      reviewed_by: req.user.id,
      reviewed_at: now
    });

    // Notify user
    await db.insert('notifications', {
      user_id: verification.user_id,
      title: status === 'verified' ? 'Identity Verified Successfully!' : 'Identity Verification Needs Attention',
      message: status === 'verified'
        ? 'Your identity documents have been approved. You now have full verified member privileges.'
        : `Your identity verification was rejected: ${rejectionReason || 'Please resubmit valid government identification.'}`,
      type: 'verification_result',
      link_url: '/profile',
      is_read: false
    });

    await logAudit({
      actorId: req.user.id,
      action: status === 'verified' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      targetEntity: 'IDENTITY_VERIFICATIONS',
      targetId: id,
      details: { targetUserId: verification.user_id, rejectionReason }
    });

    res.json({ message: `Verification status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function getAllRentalsAdmin(req, res, next) {
  try {
    const rentals = await db.find('rentals', {}, { orderBy: 'created_at', orderDirection: 'desc' });
    const items = await db.find('items');
    const users = await db.find('users');

    const itmMap = Object.fromEntries(items.map(i => [i.id, i]));
    const usrMap = Object.fromEntries(users.map(u => [u.id, u]));

    const result = rentals.map(r => ({
      ...r,
      itemTitle: itmMap[r.item_id]?.title || 'Unknown Item',
      renterName: usrMap[r.renter_id]?.full_name || 'Unknown Renter',
      ownerName: usrMap[r.owner_id]?.full_name || 'Unknown Owner'
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getReportsAdmin(req, res, next) {
  try {
    const reports = await db.find('reports', {}, { orderBy: 'created_at', orderDirection: 'desc' });
    const users = await db.find('users');
    const items = await db.find('items');

    const usrMap = Object.fromEntries(users.map(u => [u.id, u]));
    const itmMap = Object.fromEntries(items.map(i => [i.id, i]));

    const populated = reports.map(rep => ({
      ...rep,
      reporterName: usrMap[rep.reporter_id]?.full_name || 'User',
      reportedUserName: rep.reported_user_id ? usrMap[rep.reported_user_id]?.full_name : null,
      reportedItemTitle: rep.reported_item_id ? itmMap[rep.reported_item_id]?.title : null
    }));

    res.json(populated);
  } catch (err) {
    next(err);
  }
}

export async function resolveReportAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "investigating", "resolved", or "dismissed".' });
    }

    const report = await db.findOne('reports', { id });
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const now = new Date().toISOString();
    await db.update('reports', { id }, {
      status,
      admin_notes: adminNotes || null,
      resolved_by: req.user.id,
      resolved_at: ['resolved', 'dismissed'].includes(status) ? now : null
    });

    // Notify reporter
    await db.insert('notifications', {
      user_id: report.reporter_id,
      title: 'Report Status Update',
      message: `Your report has been marked as ${status}. ${adminNotes ? 'Note: ' + adminNotes : ''}`,
      type: 'report_updated',
      link_url: '/profile',
      is_read: false
    });

    await logAudit({
      actorId: req.user.id,
      action: 'REPORT_RESOLVED',
      targetEntity: 'REPORTS',
      targetId: id,
      details: { status, adminNotes }
    });

    res.json({ message: 'Report updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const logs = await db.find('audit_logs', {}, { orderBy: 'created_at', orderDirection: 'desc', limit: 100 });
    const users = await db.find('users');
    const uMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));

    const populated = logs.map(l => ({
      ...l,
      actorName: l.actor_id ? uMap[l.actor_id] || 'System' : 'System'
    }));

    res.json(populated);
  } catch (err) {
    next(err);
  }
}
