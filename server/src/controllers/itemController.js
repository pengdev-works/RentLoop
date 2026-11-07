import { db } from '../database/db.js';
import { logAudit } from '../utils/logger.js';

export async function getItems(req, res, next) {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      city,
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;

    // Fetch all active items
    let allItems = await db.find('items', { status: 'active' });

    // Join category, images, and owner
    const categories = await db.find('item_categories');
    const images = await db.find('item_images');
    const users = await db.find('users');
    const profiles = await db.find('user_profiles');
    const verifications = await db.find('identity_verifications');

    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));
    const verifMap = Object.fromEntries(verifications.map(v => [v.user_id, v]));

    let itemsWithDetails = allItems.map(item => {
      const itemImgs = images
        .filter(img => img.item_id === item.id)
        .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      const owner = userMap[item.owner_id] || {};
      const ownerProfile = profileMap[item.owner_id] || {};
      const ownerVerif = verifMap[item.owner_id] || {};
      const cat = catMap[item.category_id] || {};

      return {
        ...item,
        category: cat,
        images: itemImgs,
        primary_image: itemImgs[0]?.image_url || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
        owner: {
          id: owner.id,
          fullName: owner.full_name,
          avatarUrl: ownerProfile.avatar_url,
          trustScore: ownerProfile.trust_score || 5.0,
          completedRentals: ownerProfile.completed_rentals_count || 0,
          isVerified: ownerVerif.status === 'verified'
        }
      };
    });

    // Apply Filters
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      itemsWithDetails = itemsWithDetails.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location_city.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'all') {
      itemsWithDetails = itemsWithDetails.filter(i =>
        i.category_id === category || i.category.slug === category
      );
    }

    if (condition && condition !== 'all') {
      itemsWithDetails = itemsWithDetails.filter(i => i.condition === condition);
    }

    if (minPrice) {
      itemsWithDetails = itemsWithDetails.filter(i => parseFloat(i.rental_price) >= parseFloat(minPrice));
    }

    if (maxPrice) {
      itemsWithDetails = itemsWithDetails.filter(i => parseFloat(i.rental_price) <= parseFloat(maxPrice));
    }

    if (city && city.trim() !== '') {
      itemsWithDetails = itemsWithDetails.filter(i =>
        i.location_city.toLowerCase().includes(city.toLowerCase().trim())
      );
    }

    // Apply Sorting
    if (sortBy === 'price_asc') {
      itemsWithDetails.sort((a, b) => parseFloat(a.rental_price) - parseFloat(b.rental_price));
    } else if (sortBy === 'price_desc') {
      itemsWithDetails.sort((a, b) => parseFloat(b.rental_price) - parseFloat(a.rental_price));
    } else if (sortBy === 'rating') {
      itemsWithDetails.sort((a, b) => (b.owner.trustScore || 0) - (a.owner.trustScore || 0));
    } else {
      // newest
      itemsWithDetails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const total = itemsWithDetails.length;
    const paginatedItems = itemsWithDetails.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      items: paginatedItems,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    next(err);
  }
}

export async function getItemById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await db.findOne('items', { id });
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const category = await db.findOne('item_categories', { id: item.category_id });
    const images = await db.find('item_images', { item_id: item.id });
    const owner = await db.findOne('users', { id: item.owner_id });
    const profile = await db.findOne('user_profiles', { user_id: item.owner_id });
    const verification = await db.findOne('identity_verifications', { user_id: item.owner_id });

    // Reviews for owner
    const reviews = await db.find('reviews', { reviewee_id: item.owner_id });
    const reviewUsers = await db.find('users');
    const reviewProfiles = await db.find('user_profiles');
    const uMap = Object.fromEntries(reviewUsers.map(u => [u.id, u]));
    const pMap = Object.fromEntries(reviewProfiles.map(p => [p.user_id, p]));

    const populatedReviews = reviews.map(r => ({
      ...r,
      reviewer: {
        fullName: uMap[r.reviewer_id]?.full_name || 'Anonymous User',
        avatarUrl: pMap[r.reviewer_id]?.avatar_url || null
      }
    }));

    res.json({
      ...item,
      category,
      images,
      owner: {
        id: owner.id,
        fullName: owner.full_name,
        avatarUrl: profile?.avatar_url,
        bio: profile?.bio,
        addressCity: profile?.address_city,
        addressProvince: profile?.address_province,
        trustScore: profile?.trust_score || 5.0,
        completedRentals: profile?.completed_rentals_count || 0,
        isVerified: verification?.status === 'verified',
        createdAt: owner.created_at
      },
      reviews: populatedReviews
    });
  } catch (err) {
    next(err);
  }
}

export async function createItem(req, res, next) {
  try {
    const {
      title,
      description,
      categoryId,
      condition,
      rentalPrice,
      priceBasis = 'daily',
      securityDeposit = 0,
      locationCity,
      locationPickupNotes,
      rentalRules,
      imageUrls = []
    } = req.body;

    if (!title || !description || !categoryId || !condition || !rentalPrice || !locationCity) {
      return res.status(400).json({
        error: 'Title, description, category, condition, rental price, and location are required.'
      });
    }

    const newItem = await db.insert('items', {
      owner_id: req.user.id,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim(),
      condition,
      rental_price: parseFloat(rentalPrice),
      price_basis: priceBasis,
      security_deposit: parseFloat(securityDeposit || 0),
      location_city: locationCity.trim(),
      location_pickup_notes: locationPickupNotes ? locationPickupNotes.trim() : '',
      rental_rules: rentalRules ? rentalRules.trim() : '',
      status: 'active',
      is_available: true
    });

    // Save uploaded files if any
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        await db.insert('item_images', {
          item_id: newItem.id,
          image_url: `/uploads/items/${file.filename}`,
          is_primary: i === 0,
          sort_order: i
        });
      }
    } else if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (let i = 0; i < imageUrls.length; i++) {
        await db.insert('item_images', {
          item_id: newItem.id,
          image_url: imageUrls[i],
          is_primary: i === 0,
          sort_order: i
        });
      }
    } else {
      // Default placeholder
      await db.insert('item_images', {
        item_id: newItem.id,
        image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
        is_primary: true,
        sort_order: 0
      });
    }

    await logAudit({
      actorId: req.user.id,
      action: 'ITEM_CREATED',
      targetEntity: 'ITEMS',
      targetId: newItem.id,
      details: { title: newItem.title, price: newItem.rental_price }
    });

    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await db.findOne('items', { id });
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // Only owner or admin can update
    if (item.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to modify this listing.' });
    }

    const {
      title,
      description,
      categoryId,
      condition,
      rentalPrice,
      priceBasis,
      securityDeposit,
      locationCity,
      locationPickupNotes,
      rentalRules,
      status,
      isAvailable
    } = req.body;

    const updates = {};
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (categoryId) updates.category_id = categoryId;
    if (condition) updates.condition = condition;
    if (rentalPrice !== undefined) updates.rental_price = parseFloat(rentalPrice);
    if (priceBasis) updates.price_basis = priceBasis;
    if (securityDeposit !== undefined) updates.security_deposit = parseFloat(securityDeposit);
    if (locationCity) updates.location_city = locationCity.trim();
    if (locationPickupNotes !== undefined) updates.location_pickup_notes = locationPickupNotes;
    if (rentalRules !== undefined) updates.rental_rules = rentalRules;
    if (status) updates.status = status;
    if (isAvailable !== undefined) updates.is_available = Boolean(isAvailable);

    const updated = await db.update('items', { id }, updates);

    // If new files were uploaded
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        await db.insert('item_images', {
          item_id: id,
          image_url: `/uploads/items/${file.filename}`,
          is_primary: false,
          sort_order: i + 10
        });
      }
    }

    await logAudit({
      actorId: req.user.id,
      action: 'ITEM_UPDATED',
      targetEntity: 'ITEMS',
      targetId: id,
      details: updates
    });

    res.json(updated[0] || updates);
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await db.findOne('items', { id });
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this listing.' });
    }

    // Check for active or ready rentals
    const activeRentals = await db.find('rentals', { item_id: id });
    const hasActive = activeRentals.some(r => ['ready_for_pickup', 'active', 'return_pending'].includes(r.status));
    if (hasActive) {
      return res.status(400).json({ error: 'Cannot delete item with active or pending return rentals.' });
    }

    await db.update('items', { id }, { status: 'archived', is_available: false });

    await logAudit({
      actorId: req.user.id,
      action: 'ITEM_ARCHIVED',
      targetEntity: 'ITEMS',
      targetId: id
    });

    res.json({ message: 'Item listing archived successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function getMyItems(req, res, next) {
  try {
    const items = await db.find('items', { owner_id: req.user.id }, { orderBy: 'created_at', orderDirection: 'desc' });
    const categories = await db.find('item_categories');
    const images = await db.find('item_images');
    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

    const populated = items.map(item => ({
      ...item,
      category: catMap[item.category_id],
      images: images.filter(img => img.item_id === item.id)
    }));

    res.json(populated);
  } catch (err) {
    next(err);
  }
}

export async function getItemBookedDates(req, res, next) {
  try {
    const { id } = req.params;
    // Get all rentals that are booked or active
    const rentals = await db.find('rentals', { item_id: id });
    const bookedRanges = rentals
      .filter(r => ['ready_for_pickup', 'active', 'return_pending'].includes(r.status))
      .map(r => ({
        startDate: r.start_date,
        endDate: r.end_date
      }));

    res.json(bookedRanges);
  } catch (err) {
    next(err);
  }
}
