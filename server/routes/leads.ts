import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStage,
  deleteLead,
} from '../controllers/leadController.js';

const router = Router();

// All lead routes require authentication
router.use(authenticateToken);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.patch('/:id/stage', updateLeadStage);
router.delete('/:id', deleteLead);

export default router;