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
    const qFolder = req.query.folder;
    if (qFolder === 'verifications' || req.originalUrl.includes('verif')) {
      folder = 'verifications';
    } else if (qFolder === 'conditions' || req.originalUrl.includes('condition')) {
      folder = 'conditions';
    } else if (qFolder === 'avatars' || qFolder === 'profile' || req.originalUrl.includes('avatar')) {
      folder = 'avatars';
    }
    cb(null, path.join(config.uploadDir, folder));
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    // If ext is missing or jfif, map appropriately
    if (!ext && file.mimetype) {
      if (file.mimetype === 'image/jpeg') ext = '.jpg';
      else if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext || '.jpg'}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow any image mimetype OR common extensions (including JFIF, HEIC, AVIF)
  const isImageMime = file.mimetype && file.mimetype.startsWith('image/');
  const isPdfMime = file.mimetype === 'application/pdf';
  const allowedExtensions = /\.(jpe?g|png|webp|gif|bmp|svg|jfif|heic|heif|avif|pdf)$/i;
  const hasAllowedExt = allowedExtensions.test(file.originalname);

  if (isImageMime || isPdfMime || hasAllowedExt) {
    cb(null, true);
  } else {
    const error = new Error('Only image files (JPEG, PNG, WEBP, GIF, JFIF, AVIF, HEIC) and PDF documents are permitted.');
    error.statusCode = 400;
    cb(error);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter
});
