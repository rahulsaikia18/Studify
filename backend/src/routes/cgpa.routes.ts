import { Router } from 'express';
import {
  CgpaController,
  calculateSgpaSchema,
  saveCgpaRecordSchema,
} from '../controllers/cgpa.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.post('/calculate-sgpa', validateBody(calculateSgpaSchema), CgpaController.calculateSgpa);
router.post('/calculate-cgpa', CgpaController.calculateCgpa);
router.get('/history', CgpaController.getHistory);
router.post('/records', validateBody(saveCgpaRecordSchema), CgpaController.saveRecord);
router.delete('/records/:id', CgpaController.deleteRecord);

export default router;
