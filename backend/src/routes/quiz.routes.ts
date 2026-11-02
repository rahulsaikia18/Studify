import { Router } from 'express';
import {
  QuizController,
  generateQuizSchema,
  submitQuizSchema,
} from '../controllers/quiz.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.post('/generate', validateBody(generateQuizSchema), QuizController.generate);
router.post('/submit', validateBody(submitQuizSchema), QuizController.submit);
router.get('/history', QuizController.getHistory);

export default router;
