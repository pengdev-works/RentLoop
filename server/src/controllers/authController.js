import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { logAudit } from '../utils/logger.js';

export async function register(req, res, next) {
  try {
    const { email, password, fullName, phone, addressCity, addressProvince, bio } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check existing email
    const existing = await db.findOne('users', { email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Always force role 'user' on self-registration (prevent privilege escalation)
    const newUser = await db.insert('users', {
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: fullName.trim(),
      phone: phone || null,
      role: 'user',
      status: 'active'
    });

    // Create linked profile
    const newProfile = await db.insert('user_profiles', {
      user_id: newUser.id,
      avatar_url: req.file ? `/uploads/avatars/${req.file.filename}` : null,
      bio: bio || '',
      address_city: addressCity || '',
      address_province: addressProvince || '',
      trust_score: 5.00,
      completed_rentals_count: 0
    });

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Initial welcome notification
    await db.insert('notifications', {
      user_id: newUser.id,
      title: 'Welcome to RentLoop!',
      message: 'Get started by browsing available items or submitting your identity verification to start listing and renting.',
      type: 'system',
      link_url: '/profile',
      is_read: false
    });

    await logAudit({
      actorId: newUser.id,
      action: 'USER_REGISTERED',
      targetEntity: 'USERS',
      targetId: newUser.id,
      details: { email: newUser.email, fullName: newUser.full_name },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        status: newUser.status,
        profile: newProfile,
        verificationStatus: 'unverified'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.findOne('users', { email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by platform administrators.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const profile = await db.findOne('user_profiles', { user_id: user.id });
    const verification = await db.findOne('identity_verifications', { user_id: user.id });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    await logAudit({
      actorId: user.id,
      action: 'USER_LOGIN',
      targetEntity: 'USERS',
      targetId: user.id,
      details: { email: user.email },
      ipAddress: req.ip
    });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profile: profile || {},
        verificationStatus: verification ? verification.status : 'unverified'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await db.findOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const profile = await db.findOne('user_profiles', { user_id: user.id });
    const verification = await db.findOne('identity_verifications', { user_id: user.id });
    const unreadNotifications = await db.count('notifications', { user_id: user.id, is_read: false });

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile: profile || {},
      verification: verification ? {
        id: verification.id,
        idType: verification.id_type,
        status: verification.status,
        rejectionReason: verification.rejection_reason,
        submittedAt: verification.submitted_at,
        reviewedAt: verification.reviewed_at
      } : null,
      unreadNotifications
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, bio, addressCity, addressProvince } = req.body;

    if (fullName) {
      await db.update('users', { id: req.user.id }, {
        full_name: fullName.trim(),
        phone: phone || null
      });
    }

    const profileUpdates = {
      bio: bio !== undefined ? bio : undefined,
      address_city: addressCity !== undefined ? addressCity : undefined,
      address_province: addressProvince !== undefined ? addressProvince : undefined
    };

    if (req.file) {
      profileUpdates.avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    // Filter out undefined
    Object.keys(profileUpdates).forEach(k => profileUpdates[k] === undefined && delete profileUpdates[k]);

    if (Object.keys(profileUpdates).length > 0) {
      await db.update('user_profiles', { user_id: req.user.id }, profileUpdates);
    }

    const updatedUser = await db.findOne('users', { id: req.user.id });
    const updatedProfile = await db.findOne('user_profiles', { user_id: req.user.id });

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profile: updatedProfile
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = await db.findOne('users', { id: req.user.id });
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.update('users', { id: req.user.id }, { password_hash: newHash });

    await logAudit({
      actorId: req.user.id,
      action: 'PASSWORD_CHANGED',
      targetEntity: 'USERS',
      targetId: req.user.id,
      details: { email: user.email },
      ipAddress: req.ip
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
}
