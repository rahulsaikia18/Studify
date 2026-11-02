import { Router } from 'express';
import {
  AttendanceController,
  courseSchema,
} from '../controllers/attendance.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.get('/quick-calc', AttendanceController.quickCalculate);
router.post('/quick-calc', AttendanceController.quickCalculate);
router.get('/courses', AttendanceController.getCourses);
router.post('/courses', validateBody(courseSchema), AttendanceController.createCourse);
router.patch('/courses/:id', AttendanceController.updateCourse);
router.post('/courses/:id/log', AttendanceController.logAttendance);
router.delete('/courses/:id', AttendanceController.deleteCourse);

export default router;
