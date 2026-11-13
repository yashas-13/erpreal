
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDashboardMetrics } from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticateToken);

router.get('/metrics', getDashboardMetrics);

export default router;
