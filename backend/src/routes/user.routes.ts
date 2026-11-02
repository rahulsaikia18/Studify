import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/profile', UserController.getProfile);
router.patch('/profile', UserController.updateProfile);
router.get('/export', UserController.exportData);
router.delete('/account', UserController.deleteAccount);

export default router;
