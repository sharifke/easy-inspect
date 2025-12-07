import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth.middleware';
import {
  uploadPhoto,
  getPhotos,
  deletePhoto,
  updatePhotoAnnotations,
} from '../controllers/photo.controller';

const router = Router({ mergeParams: true });

import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Temporary upload directory - files will be moved to final location in controller
    const tempDir = 'uploads/temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    // Generate temporary filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  },
});

/**
 * Photo Routes
 * All routes require authentication
 * Routes are mounted under /api/inspections/:id/results/:resultId/photos
 */

// POST /api/inspections/:id/results/:resultId/photos - Upload photo
router.post(
  '/',
  authenticate,
  upload.single('photo'),
  uploadPhoto
);

// GET /api/inspections/:id/results/:resultId/photos - Get all photos for result
router.get('/', authenticate, getPhotos);

// DELETE /api/inspections/:id/results/:resultId/photos/:photoId - Delete photo
router.delete('/:photoId', authenticate, deletePhoto);

// PATCH /api/inspections/:id/results/:resultId/photos/:photoId/annotations - Update annotations
router.patch('/:photoId/annotations', authenticate, updatePhotoAnnotations);

export default router;
