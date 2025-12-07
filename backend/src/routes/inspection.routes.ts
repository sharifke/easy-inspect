import { Router } from 'express';
import {
  getAllInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  saveInspectionResult,
  completeInspection,
  saveSignature,
} from '../controllers/inspection.controller';
import { authenticate } from '../middleware/auth.middleware';
import photoRoutes from './photo.routes';

const router = Router();

/**
 * Inspection Routes
 * All routes require authentication
 * Authorization is handled within each controller
 */

// GET /api/inspections - Get all inspections for authenticated user
router.get('/', authenticate, getAllInspections);

// GET /api/inspections/:id - Get single inspection with full details
router.get('/:id', authenticate, getInspectionById);

// POST /api/inspections - Create new inspection from template
router.post('/', authenticate, createInspection);

// PUT /api/inspections/:id - Update inspection
router.put('/:id', authenticate, updateInspection);

// DELETE /api/inspections/:id - Delete inspection (DRAFT only)
router.delete('/:id', authenticate, deleteInspection);

// POST /api/inspections/:id/results - Save/update inspection result
router.post('/:id/results', authenticate, saveInspectionResult);

// PUT /api/inspections/:id/complete - Mark inspection as completed
router.put('/:id/complete', authenticate, completeInspection);

// POST /api/inspections/:id/signature - Save signature for completed inspection
router.post('/:id/signature', authenticate, saveSignature);

// Photo routes - nested under /api/inspections/:id/results/:resultId/photos
router.use('/:id/results/:resultId/photos', photoRoutes);

export default router;
