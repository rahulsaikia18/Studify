import { Router } from 'express';
import {
  ExamsController,
  examSchema,
} from '../controllers/exams.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.get('/', ExamsController.getExams);
router.post('/', validateBody(examSchema), ExamsController.createExam);
router.patch('/:id', ExamsController.updateExam);
router.delete('/:id', ExamsController.deleteExam);

export default router;
