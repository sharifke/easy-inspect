import { Router } from 'express';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '../controllers/template.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

/**
 * Template Routes
 * All routes require authentication
 * Admin-only routes: POST, PUT, DELETE
 */

// GET /api/templates - Get all active templates (authenticated users)
router.get('/', authenticate, getAllTemplates);

// GET /api/templates/:id - Get single template by ID (authenticated users)
router.get('/:id', authenticate, getTemplateById);

// POST /api/templates - Create new template (admin only)
router.post('/', authenticate, requireAdmin, createTemplate);

// PUT /api/templates/:id - Update template (admin only)
router.put('/:id', authenticate, requireAdmin, updateTemplate);

// DELETE /api/templates/:id - Soft delete template (admin only)
router.delete('/:id', authenticate, requireAdmin, deleteTemplate);

// POST /api/templates/:id/duplicate - Duplicate template (admin only)
router.post('/:id/duplicate', authenticate, requireAdmin, duplicateTemplate);

export default router;
