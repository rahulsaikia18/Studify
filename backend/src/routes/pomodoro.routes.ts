import { Router } from 'express';
import {
  PomodoroController,
  logPomodoroSchema,
} from '../controllers/pomodoro.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.post('/log', validateBody(logPomodoroSchema), PomodoroController.logSession);
router.get('/stats', PomodoroController.getStats);

export default router;
