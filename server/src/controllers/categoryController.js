import { db } from '../database/db.js';
import { logAudit } from '../utils/logger.js';

export async function getCategories(req, res, next) {
  try {
    const categories = await db.find('item_categories', { is_active: true }, { orderBy: 'name' });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function getAllCategoriesAdmin(req, res, next) {
  try {
    const categories = await db.find('item_categories', {}, { orderBy: 'name' });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description, iconName } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await db.findOne('item_categories', { slug });
    if (existing) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }

    const category = await db.insert('item_categories', {
      name: name.trim(),
      slug,
      description: description || '',
      icon_name: iconName || 'Package',
      is_active: true
    });

    await logAudit({
      actorId: req.user.id,
      action: 'CATEGORY_CREATED',
      targetEntity: 'ITEM_CATEGORIES',
      targetId: category.id,
      details: { name: category.name }
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, iconName, isActive } = req.body;

    const existing = await db.findOne('item_categories', { id });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (iconName) updateData.icon_name = iconName;
    if (isActive !== undefined) updateData.is_active = Boolean(isActive);

    const updated = await db.update('item_categories', { id }, updateData);

    await logAudit({
      actorId: req.user.id,
      action: 'CATEGORY_UPDATED',
      targetEntity: 'ITEM_CATEGORIES',
      targetId: id,
      details: updateData
    });

    res.json(updated[0] || updateData);
  } catch (err) {
    next(err);
  }
}

