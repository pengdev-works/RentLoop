import { db } from '../database/db.js';
import { logAudit } from '../utils/logger.js';

// Helper: check date overlap
function datesOverlap(startA, endA, startB, endB) {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();
  return sA <= eB && eA >= sB;
}

export async function createRentalRequest(req, res, next) {
  try {
    const { itemId, startDate, endDate, rentalPurpose } = req.body;

    if (!itemId || !startDate || !endDate || !rentalPurpose) {
      return res.status(400).json({ error: 'Item ID, start date, end date, and purpose are required.' });
    }

    const item = await db.findOne('items', { id: itemId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.status !== 'active' || !item.is_available) {
      return res.status(400).json({ error: 'This item is currently not available for rental.' });
    }

    if (item.owner_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot rent an item that you own.' });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sDate < today) {
      return res.status(400).json({ error: 'Rental start date cannot be in the past.' });
    }

    if (eDate < sDate) {
      return res.status(400).json({ error: 'Rental end date must be on or after the start date.' });
    }

    // Double-booking check against existing active bookings
    const existingRentals = await db.find('rentals', { item_id: itemId });
    const hasConflict = existingRentals.some(r =>
      ['ready_for_pickup', 'active', 'return_pending'].includes(r.status) &&
      datesOverlap(startDate, endDate, r.start_date, r.end_date)
    );

    if (hasConflict) {
      return res.status(409).json({
        error: 'The requested dates overlap with an existing confirmed rental for this item. Please choose different dates.'
      });
    }

    // Calculate duration in days (minimum 1 day)
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const calculatedPrice = (parseFloat(item.rental_price) * diffDays);
    const securityDeposit = parseFloat(item.security_deposit || 0);

    const rentalReq = await db.insert('rental_requests', {
      item_id: itemId,
      renter_id: req.user.id,
      owner_id: item.owner_id,
      start_date: startDate,
      end_date: endDate,
      calculated_price: calculatedPrice,
      security_deposit: securityDeposit,
      rental_purpose: rentalPurpose.trim(),
      status: 'pending'
    });

    // Notify Owner
    await db.insert('notifications', {
      user_id: item.owner_id,
      title: 'New Rental Request Received',
      message: `${req.user.fullName} requested to rent "${item.title}" from ${startDate} to ${endDate}.`,
      type: 'rental_request',
      link_url: '/owner/requests',
      is_read: false
    });

    await logAudit({
      actorId: req.user.id,
      action: 'RENTAL_REQUEST_CREATED',
      targetEntity: 'RENTAL_REQUESTS',
      targetId: rentalReq.id,
      details: { itemId, startDate, endDate, calculatedPrice }
    });

    res.status(201).json(rentalReq);
  } catch (err) {
    next(err);
  }
}

export async function getRenterRequests(req, res, next) {
  try {
    const requests = await db.find('rental_requests', { renter_id: req.user.id }, { orderBy: 'created_at', orderDirection: 'desc' });
    const items = await db.find('items');
    const users = await db.find('users');
    const images = await db.find('item_images');
    const rentals = await db.find('rentals', { renter_id: req.user.id });

    const itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const rentalMap = Object.fromEntries(rentals.map(r => [r.request_id, r]));

    const populated = requests.map(r => {
      const itm = itemMap[r.item_id] || {};
      const owner = userMap[r.owner_id] || {};
      const itemImgs = images.filter(img => img.item_id === r.item_id);
      return {
        ...r,
        item: {
          ...itm,
          primaryImage: itemImgs[0]?.image_url || null
        },
        owner: {
          id: owner.id,
          fullName: owner.full_name,
          phone: owner.phone,
          email: owner.email
        },
        rental: rentalMap[r.id] || null
      };
    });

    res.json(populated);
  } catch (err) {
    next(err);
  }
}

export async function getOwnerRequests(req, res, next) {
  try {
    const requests = await db.find('rental_requests', { owner_id: req.user.id }, { orderBy: 'created_at', orderDirection: 'desc' });
    const items = await db.find('items');
    const users = await db.find('users');
    const profiles = await db.find('user_profiles');
    const verifications = await db.find('identity_verifications');
    const rentals = await db.find('rentals', { owner_id: req.user.id });

    const itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const profMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));
    const verMap = Object.fromEntries(verifications.map(v => [v.user_id, v]));
    const rentalMap = Object.fromEntries(rentals.map(r => [r.request_id, r]));

    const populated = requests.map(r => {
      const itm = itemMap[r.item_id] || {};
      const renter = userMap[r.renter_id] || {};
      const renterProf = profMap[r.renter_id] || {};
      const renterVer = verMap[r.renter_id] || {};

      return {
        ...r,
        item: itm,
        renter: {
          id: renter.id,
          fullName: renter.full_name,
          phone: renter.phone,
          email: renter.email,
          avatarUrl: renterProf.avatar_url,
          trustScore: renterProf.trust_score || 5.0,
          completedRentals: renterProf.completed_rentals_count || 0,
          isVerified: renterVer.status === 'verified'
        },
        rental: rentalMap[r.id] || null
      };
    });

    res.json(populated);
  } catch (err) {
    next(err);
  }
}

export async function approveRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await db.findOne('rental_requests', { id });

    if (!request) {
      return res.status(404).json({ error: 'Rental request not found.' });
    }

    if (request.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the item owner can approve this request.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve request with current status: ${request.status}` });
    }

    // Re-verify no overlapping booking exists
    const existingRentals = await db.find('rentals', { item_id: request.item_id });
    const hasConflict = existingRentals.some(r =>
      ['ready_for_pickup', 'active', 'return_pending'].includes(r.status) &&
      datesOverlap(request.start_date, request.end_date, r.start_date, r.end_date)
    );

    if (hasConflict) {
      return res.status(409).json({
        error: 'Cannot approve: another confirmed booking now conflicts with these dates.'
      });
    }

    // Update request
    await db.update('rental_requests', { id }, { status: 'approved' });

    // Generate handover secret code
    const handoverCode = 'RL-' + Math.floor(1000 + Math.random() * 9000);

    // Create active rental record
    const rental = await db.insert('rentals', {
      request_id: request.id,
      item_id: request.item_id,
      renter_id: request.renter_id,
      owner_id: request.owner_id,
      start_date: request.start_date,
      end_date: request.end_date,
      total_amount: request.calculated_price,
      security_deposit: request.security_deposit,
      status: 'ready_for_pickup'
    });

    // Create handover confirmation tracker
    await db.insert('handover_confirmations', {
      rental_id: rental.id,
      stage: 'handover',
      owner_confirmed: false,
      renter_confirmed: false,
      handover_code: handoverCode
    });

    const item = await db.findOne('items', { id: request.item_id });

    // Notify renter
    await db.insert('notifications', {
      user_id: request.renter_id,
      title: 'Rental Request Approved!',
      message: `Your rental request for "${item.title}" has been approved! Ready for pickup from ${request.start_date}. Handover Code: ${handoverCode}`,
      type: 'approval',
      link_url: `/rentals/${rental.id}`,
      is_read: false
    });

    await logAudit({
      actorId: req.user.id,
      action: 'RENTAL_REQUEST_APPROVED',
      targetEntity: 'RENTAL_REQUESTS',
      targetId: id,
      details: { rentalId: rental.id, handoverCode }
    });

    res.json({ message: 'Rental request approved successfully.', rental });
  } catch (err) {
    next(err);
  }
}

export async function rejectRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await db.findOne('rental_requests', { id });
    if (!request) {
      return res.status(404).json({ error: 'Rental request not found.' });
    }

    if (request.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the item owner can reject this request.' });
    }

    await db.update('rental_requests', { id }, {
      status: 'rejected',
      rejection_reason: reason || 'Item owner was unable to accommodate the requested rental window.'
    });

    const item = await db.findOne('items', { id: request.item_id });

    // Notify renter
    await db.insert('notifications', {
      user_id: request.renter_id,
      title: 'Rental Request Update',
      message: `Your rental request for "${item.title}" was not approved: ${reason || 'Owner unavailable'}`,
      type: 'rental_update',
      link_url: '/renter/requests',
      is_read: false
    });

    await logAudit({
      actorId: req.user.id,
      action: 'RENTAL_REQUEST_REJECTED',
      targetEntity: 'RENTAL_REQUESTS',
      targetId: id,
      details: { reason }
    });

    res.json({ message: 'Rental request rejected.' });
  } catch (err) {
    next(err);
  }
}

export async function cancelRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await db.findOne('rental_requests', { id });
    if (!request) {
      return res.status(404).json({ error: 'Rental request not found.' });
    }

    if (request.renter_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the renter can cancel this request.' });
    }

    if (request.status !== 'pending' && request.status !== 'approved') {
      return res.status(400).json({ error: `Cannot cancel request in status: ${request.status}` });
    }

    await db.update('rental_requests', { id }, { status: 'cancelled' });

    // If an associated rental was created, cancel it as well
    const associatedRental = await db.findOne('rentals', { request_id: id });
    if (associatedRental && associatedRental.status === 'ready_for_pickup') {
      await db.update('rentals', { id: associatedRental.id }, { status: 'cancelled' });
    }

    const item = await db.findOne('items', { id: request.item_id });

    // Notify owner
    await db.insert('notifications', {
      user_id: request.owner_id,
      title: 'Rental Request Cancelled',
      message: `The rental booking for "${item.title}" was cancelled by the renter.`,
      type: 'cancellation',
      link_url: '/owner/requests',
      is_read: false
    });

    res.json({ message: 'Rental booking cancelled.' });
  } catch (err) {
    next(err);
  }
}

export async function getRentalById(req, res, next) {
  try {
    const { id } = req.params;
    const rental = await db.findOne('rentals', { id });
    if (!rental) {
      return res.status(404).json({ error: 'Rental record not found.' });
    }

    const isParty = rental.renter_id === req.user.id || rental.owner_id === req.user.id || req.user.role === 'admin';
    if (!isParty) {
      return res.status(403).json({ error: 'Unauthorized to view this rental record.' });
    }

    const item = await db.findOne('items', { id: rental.item_id });
    const itemImages = await db.find('item_images', { item_id: rental.item_id });
    const renter = await db.findOne('users', { id: rental.renter_id });
    const owner = await db.findOne('users', { id: rental.owner_id });
    const renterProf = await db.findOne('user_profiles', { user_id: rental.renter_id });
    const ownerProf = await db.findOne('user_profiles', { user_id: rental.owner_id });
    const confirmations = await db.find('handover_confirmations', { rental_id: rental.id });
    const conditionReports = await db.find('rental_condition_reports', { rental_id: rental.id });
    const conditionImages = await db.find('rental_condition_images');
    const reviews = await db.find('reviews', { rental_id: rental.id });

    const populatedReports = conditionReports.map(cr => ({
      ...cr,
      images: conditionImages.filter(ci => ci.report_id === cr.id)
    }));

    res.json({
      ...rental,
      item: {
        ...item,
        images: itemImages
      },
      renter: {
        id: renter.id,
        fullName: renter.full_name,
        email: renter.email,
        phone: renter.phone,
        avatarUrl: renterProf?.avatar_url,
        trustScore: renterProf?.trust_score
      },
      owner: {
        id: owner.id,
        fullName: owner.full_name,
        email: owner.email,
        phone: owner.phone,
        avatarUrl: ownerProf?.avatar_url,
        trustScore: ownerProf?.trust_score
      },
      confirmations,
      conditionReports: populatedReports,
      reviews
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmHandover(req, res, next) {
  try {
    const { id } = req.params;
    const { handoverCode } = req.body;

    const rental = await db.findOne('rentals', { id });
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found.' });
    }

    const isOwner = rental.owner_id === req.user.id;
    const isRenter = rental.renter_id === req.user.id;

    if (!isOwner && !isRenter && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const handover = await db.findOne('handover_confirmations', { rental_id: id, stage: 'handover' });
    if (!handover) {
      return res.status(404).json({ error: 'Handover record not found.' });
    }

    const updates = {};
    const now = new Date().toISOString();

    if (isOwner) {
      updates.owner_confirmed = true;
      updates.owner_confirmed_at = now;
    }
    if (isRenter) {
      if (handoverCode && handover.handover_code && handoverCode.trim().toUpperCase() !== handover.handover_code.toUpperCase()) {
        return res.status(400).json({ error: 'Incorrect handover code provided.' });
      }
      updates.renter_confirmed = true;
      updates.renter_confirmed_at = now;
    }

    await db.update('handover_confirmations', { id: handover.id }, updates);

    // Check if both or primary confirmed to transition status to ACTIVE
    const updatedHandover = await db.findOne('handover_confirmations', { id: handover.id });
    if (updatedHandover.owner_confirmed || updatedHandover.renter_confirmed) {
      await db.update('rentals', { id }, {
        status: 'active',
        handover_date: now
      });

      // Prepare return confirmation record
      const returnCode = 'RL-' + Math.floor(1000 + Math.random() * 9000);
      const existingReturn = await db.findOne('handover_confirmations', { rental_id: id, stage: 'return' });
      if (!existingReturn) {
        await db.insert('handover_confirmations', {
          rental_id: id,
          stage: 'return',
          owner_confirmed: false,
          renter_confirmed: false,
          handover_code: returnCode
        });
      }
    }

    res.json({ message: 'Handover confirmation recorded successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function confirmReturn(req, res, next) {
  try {
    const { id } = req.params;
    const rental = await db.findOne('rentals', { id });
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found.' });
    }

    const isOwner = rental.owner_id === req.user.id;
    const isRenter = rental.renter_id === req.user.id;

    if (!isOwner && !isRenter && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const returnRecord = await db.findOne('handover_confirmations', { rental_id: id, stage: 'return' });
    const now = new Date().toISOString();
    const updates = {};

    if (isOwner) {
      updates.owner_confirmed = true;
      updates.owner_confirmed_at = now;
    }
    if (isRenter) {
      updates.renter_confirmed = true;
      updates.renter_confirmed_at = now;
    }

    if (returnRecord) {
      await db.update('handover_confirmations', { id: returnRecord.id }, updates);
    }

    // Complete rental
    await db.update('rentals', { id }, {
      status: 'completed',
      returned_date: now
    });

    // Increment completed rental counts for both parties
    const renterProf = await db.findOne('user_profiles', { user_id: rental.renter_id });
    const ownerProf = await db.findOne('user_profiles', { user_id: rental.owner_id });

    if (renterProf) {
      await db.update('user_profiles', { user_id: rental.renter_id }, {
        completed_rentals_count: (renterProf.completed_rentals_count || 0) + 1
      });
    }
    if (ownerProf) {
      await db.update('user_profiles', { user_id: rental.owner_id }, {
        completed_rentals_count: (ownerProf.completed_rentals_count || 0) + 1
      });
    }

    // Notify both to leave reviews
    await db.insert('notifications', {
      user_id: rental.renter_id,
      title: 'Rental Completed! Leave a Review',
      message: 'Your item return was confirmed. Please leave a review for the item owner.',
      type: 'review',
      link_url: `/rentals/${id}`,
      is_read: false
    });

    await db.insert('notifications', {
      user_id: rental.owner_id,
      title: 'Rental Completed! Leave a Review',
      message: 'The item was successfully returned. Please leave a review for the renter.',
      type: 'review',
      link_url: `/rentals/${id}`,
      is_read: false
    });

    await logAudit({
      actorId: req.user.id,
      action: 'RENTAL_COMPLETED',
      targetEntity: 'RENTALS',
      targetId: id
    });

    res.json({ message: 'Rental marked as completed! You can now write a mutual review.' });
  } catch (err) {
    next(err);
  }
}
