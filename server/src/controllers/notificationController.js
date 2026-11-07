import { db } from '../database/db.js';

export async function getNotifications(req, res, next) {
  try {
    const notifications = await db.find(
      'notifications',
      { user_id: req.user.id },
      { orderBy: 'created_at', orderDirection: 'desc', limit: 50 }
    );
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    await db.update('notifications', { id, user_id: req.user.id }, { is_read: true });
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    await db.update('notifications', { user_id: req.user.id }, { is_read: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    await db.delete('notifications', { id, user_id: req.user.id });
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
}

