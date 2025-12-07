import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { generateInspectionReport } from '../controllers/report.controller';

const router = Router();

// Generate PDF report for an inspection
router.get('/inspections/:inspectionId/pdf', authenticate, generateInspectionReport);

export default router;
