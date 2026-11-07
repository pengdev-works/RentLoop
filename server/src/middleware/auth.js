import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../database/db.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.findOne('users', { id: decoded.userId });

    if (!user) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been suspended by administrators.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await db.findOne('users', { id: decoded.userId });
      if (user && user.status !== 'suspended') {
        req.user = {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          status: user.status
        };
      }
    } catch {
      // Ignored for optional auth
    }
  }

  next();
}

