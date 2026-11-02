import { Router } from 'express';
import {
  StudyController,
  studySessionSchema,
} from '../controllers/study.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.get('/sessions', StudyController.getSessions);
router.post('/sessions', validateBody(studySessionSchema), StudyController.createSession);
router.patch('/sessions/:id', StudyController.updateSession);
router.delete('/sessions/:id', StudyController.deleteSession);
router.get('/weekly-progress', StudyController.getWeeklyProgress);

export default router;
