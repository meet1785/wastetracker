import { Router } from 'express';
import {
  getDashboard,
  getWasteAnalytics,
  getWasteLogs,
  createWasteLog,
  getSavingsReport,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/waste', getWasteAnalytics);
router.get('/waste/logs', getWasteLogs);
router.post('/waste/logs', createWasteLog);
router.get('/savings', getSavingsReport);

export default router;
