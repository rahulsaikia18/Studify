import { Router } from 'express';
import { AdMobController, verifyRewardSchema } from '../controllers/admob.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.get('/config', AdMobController.getConfig);
router.post('/verify-reward', validateBody(verifyRewardSchema), AdMobController.verifyReward);
router.get('/rewards', AdMobController.getActiveRewards);

export default router;
