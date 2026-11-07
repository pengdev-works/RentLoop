import { db } from '../database/db.js';
import { logAudit } from '../utils/logger.js';

export async function createReview(req, res, next) {
  try {
    const { rentalId, rating, comment } = req.body;

    if (!rentalId || !rating || !comment) {
      return res.status(400).json({ error: 'Rental ID, numerical rating (1-5), and written comment are required.' });
    }

    const numRating = parseInt(rating, 10);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const rental = await db.findOne('rentals', { id: rentalId });
    if (!rental) {
      return res.status(404).json({ error: 'Rental record not found.' });
    }

    if (rental.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted after the rental has been marked as completed.' });
    }

    const isRenter = rental.renter_id === req.user.id;
    const isOwner = rental.owner_id === req.user.id;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ error: 'Only participants of this completed rental can submit a review.' });
    }

    const revieweeId = isRenter ? rental.owner_id : rental.renter_id;

    // Prevent duplicate reviews
    const existing = await db.findOne('reviews', { rental_id: rentalId, reviewer_id: req.user.id });
    if (existing) {
      return res.status(409).json({ error: 'You have already submitted a review for this rental transaction.' });
    }

    const review = await db.insert('reviews', {
      rental_id: rentalId,
      reviewer_id: req.user.id,
      reviewee_id: revieweeId,
      rating: numRating,
      comment: comment.trim()
    });

    // Recalculate target user's trust score
    const allUserReviews = await db.find('reviews', { reviewee_id: revieweeId });
    if (allUserReviews.length > 0) {
      const avg = (allUserReviews.reduce((sum, r) => sum + r.rating, 0) / allUserReviews.length).toFixed(2);
      await db.update('user_profiles', { user_id: revieweeId }, { trust_score: parseFloat(avg) });
    }

    // Notify reviewee
    await db.insert('notifications', {
      user_id: revieweeId,
      title: 'New Review Received',
      message: `${req.user.fullName} left you a ${numRating}-star review for completed rental!`,
      type: 'review_received',
      link_url: `/users/${revieweeId}`,
      is_read: false
    });

    await logAudit({
      actorId: req.user.id,
      action: 'REVIEW_SUBMITTED',
      targetEntity: 'REVIEWS',
      targetId: review.id,
      details: { rentalId, revieweeId, rating: numRating }
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

