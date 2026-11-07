import { db } from '../database/db.js';
import { logAudit } from '../utils/logger.js';

export async function submitIdentityVerification(req, res, next) {
  try {
    const { idType, idNumber } = req.body;

    if (!idType || !idNumber) {
      return res.status(400).json({ error: 'ID type and ID document number are required.' });
    }

    // Check if files or URLs provided
    let frontImageUrl = req.files && req.files['frontImage'] ? `/uploads/verifications/${req.files['frontImage'][0].filename}` : req.body.frontImageUrl;
    let backImageUrl = req.files && req.files['backImage'] ? `/uploads/verifications/${req.files['backImage'][0].filename}` : req.body.backImageUrl;
    let selfieImageUrl = req.files && req.files['selfieImage'] ? `/uploads/verifications/${req.files['selfieImage'][0].filename}` : req.body.selfieImageUrl;

    if (!frontImageUrl) {
      return res.status(400).json({ error: 'Front image of the identification card is required.' });
    }

    const existing = await db.findOne('identity_verifications', { user_id: req.user.id });

    let verification;
    if (existing) {
      const updated = await db.update('identity_verifications', { id: existing.id }, {
        id_type: idType,
        id_number: idNumber,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl || null,
        selfie_image_url: selfieImageUrl || null,
        status: 'pending',
        rejection_reason: null,
        submitted_at: new Date().toISOString()
      });
      verification = updated[0];
    } else {
      verification = await db.insert('identity_verifications', {
        user_id: req.user.id,
        id_type: idType,
        id_number: idNumber,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl || null,
        selfie_image_url: selfieImageUrl || null,
        status: 'pending'
      });
    }

    // Notify admins
    const admins = await db.find('users', { role: 'admin' });
    for (const admin of admins) {
      await db.insert('notifications', {
        user_id: admin.id,
        title: 'New Verification Submission',
        message: `${req.user.fullName} has submitted identity verification for review.`,
        type: 'verification_submitted',
        link_url: '/admin/verifications',
        is_read: false
      });
    }

    await logAudit({
      actorId: req.user.id,
      action: 'IDENTITY_VERIFICATION_SUBMITTED',
      targetEntity: 'IDENTITY_VERIFICATIONS',
      targetId: verification.id,
      details: { idType }
    });

    res.status(201).json({
      message: 'Identity documents submitted successfully. Platform administrators will review your submission shortly.',
      verification
    });
  } catch (err) {
    next(err);
  }
}

export async function getPublicUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const user = await db.findOne('users', { id });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const profile = await db.findOne('user_profiles', { user_id: id });
    const verification = await db.findOne('identity_verifications', { user_id: id });

    // Active items listed by this user
    const items = await db.find('items', { owner_id: id, status: 'active' });
    const images = await db.find('item_images');
    const itemsWithImages = items.map(item => ({
      ...item,
      images: images.filter(img => img.item_id === item.id)
    }));

    // Reviews received
    const reviews = await db.find('reviews', { reviewee_id: id });
    const allUsers = await db.find('users');
    const allProfiles = await db.find('user_profiles');
    const uMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
    const pMap = Object.fromEntries(allProfiles.map(p => [p.user_id, p]));

    const populatedReviews = reviews.map(r => ({
      ...r,
      reviewer: {
        fullName: uMap[r.reviewer_id]?.full_name || 'Verified User',
        avatarUrl: pMap[r.reviewer_id]?.avatar_url || null
      }
    }));

    // Calculate dynamic rating
    let averageRating = profile?.trust_score || 5.0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = (sum / reviews.length).toFixed(2);
    }

    // Note: ID numbers and private ID document images are NEVER exposed publicly!
    res.json({
      id: user.id,
      fullName: user.full_name,
      avatarUrl: profile?.avatar_url,
      bio: profile?.bio,
      addressCity: profile?.address_city,
      addressProvince: profile?.address_province,
      trustScore: parseFloat(averageRating),
      completedRentals: profile?.completed_rentals_count || 0,
      isVerified: verification?.status === 'verified',
      memberSince: user.created_at,
      items: itemsWithImages,
      reviews: populatedReviews
    });
  } catch (err) {
    next(err);
  }
}
