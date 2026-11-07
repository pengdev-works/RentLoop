import { db } from '../database/db.js';

export async function logAudit({
  actorId = null,
  action,
  targetEntity,
  targetId = null,
  details = {},
  ipAddress = '127.0.0.1'
}) {
  try {
    await db.insert('audit_logs', {
      actor_id: actorId,
      action,
      target_entity: targetEntity,
      target_id: targetId ? targetId.toString() : null,
      details_json: JSON.stringify(details),
      ip_address: ipAddress
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

