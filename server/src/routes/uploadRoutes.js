import express from 'express';
import { upload } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    let folder = 'items';
    const queryFolder = req.query.folder;
    if (queryFolder === 'verifications' || req.originalUrl.includes('verif')) {
      folder = 'verifications';
    } else if (queryFolder === 'conditions' || req.originalUrl.includes('condition')) {
      folder = 'conditions';
    } else if (queryFolder === 'avatars' || queryFolder === 'profile' || req.originalUrl.includes('avatar')) {
      folder = 'avatars';
    }

    const fileUrl = `/uploads/${folder}/${req.file.filename}`;

    res.status(201).json({
      message: 'File uploaded successfully.',
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  });
});

export default router;
