import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

// Ensure storage subfolders exist
const folders = ['items', 'verifications', 'conditions', 'avatars'];
folders.forEach(f => {
  const target = path.join(config.uploadDir, f);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'items';
    if (req.originalUrl.includes('verif')) folder = 'verifications';
    else if (req.originalUrl.includes('condition')) folder = 'conditions';
    else if (req.originalUrl.includes('avatar') || req.originalUrl.includes('profile')) folder = 'avatars';
    cb(null, path.join(config.uploadDir, folder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedTypes.test(ext) || allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP and PDF files are permitted.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter
});
