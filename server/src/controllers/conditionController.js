import { db } from '../database/db.js';
import { logAudit } from '../utils/logger.js';

export async function submitConditionReport(req, res, next) {
  try {
    const { rentalId, stage, itemCondition, conditionNotes, damagesNoted, imageUrls = [] } = req.body;

    if (!rentalId || !stage || !itemCondition || !conditionNotes) {
      return res.status(400).json({ error: 'Rental ID, stage (pre_rental/post_rental), condition, and notes are required.' });
    }

    const rental = await db.findOne('rentals', { id: rentalId });
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found.' });
    }

    const isParty = rental.owner_id === req.user.id || rental.renter_id === req.user.id || req.user.role === 'admin';
    if (!isParty) {
      return res.status(403).json({ error: 'Unauthorized to submit condition report for this rental.' });
    }

    const report = await db.insert('rental_condition_reports', {
      rental_id: rentalId,
      reported_by: req.user.id,
      stage,
      item_condition: itemCondition,
      condition_notes: conditionNotes.trim(),
      damages_noted: damagesNoted ? damagesNoted.trim() : null,
      verified_by_counterpart: false
    });

    // Save uploaded images
    const savedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const img = await db.insert('rental_condition_images', {
          report_id: report.id,
          image_url: `/uploads/conditions/${file.filename}`,
          caption: `${stage === 'pre_rental' ? 'Pre-Rental' : 'Post-Rental'} inspection photo`
        });
        savedImages.push(img);
      }
    } else if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (const url of imageUrls) {
        const img = await db.insert('rental_condition_images', {
          report_id: report.id,
          image_url: url,
          caption: `${stage === 'pre_rental' ? 'Pre-Rental' : 'Post-Rental'} inspection photo`
        });
        savedImages.push(img);
      }
    }

    // Notify counterpart
    const recipientId = req.user.id === rental.owner_id ? rental.renter_id : rental.owner_id;
    await db.insert('notifications', {
      user_id: recipientId,
      title: `${stage === 'pre_rental' ? 'Pre-Rental' : 'Post-Rental'} Condition Documented`,
      message: `${req.user.fullName} uploaded a condition report with photos for your rental. Please review and sign off.`,
      type: 'condition_report',
      link_url: `/rentals/${rentalId}`,
      is_read: false
    });

    await logAudit({
      actorId: req.user.id,
      action: 'CONDITION_REPORT_SUBMITTED',
      targetEntity: 'RENTAL_CONDITION_REPORTS',
      targetId: report.id,
      details: { rentalId, stage, itemCondition }
    });

    res.status(201).json({ ...report, images: savedImages });
  } catch (err) {
    next(err);
  }
}

export async function verifyConditionReport(req, res, next) {
  try {
    const { id } = req.params;
    const report = await db.findOne('rental_condition_reports', { id });
    if (!report) {
      return res.status(404).json({ error: 'Condition report not found.' });
    }

    const rental = await db.findOne('rentals', { id: report.rental_id });
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found.' });
    }

    // Only counterpart can sign off
    if (report.reported_by === req.user.id && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'You cannot sign off on your own condition report; counterpart verification is required.' });
    }

    await db.update('rental_condition_reports', { id }, { verified_by_counterpart: true });

    await logAudit({
      actorId: req.user.id,
      action: 'CONDITION_REPORT_VERIFIED',
      targetEntity: 'RENTAL_CONDITION_REPORTS',
      targetId: id
    });

    res.json({ message: 'Condition report verified and signed off successfully.' });
  } catch (err) {
    next(err);
  }
}
