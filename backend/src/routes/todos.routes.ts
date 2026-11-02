import { Router } from 'express';
import {
  TodosController,
  todoSchema,
} from '../controllers/todos.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.get('/', TodosController.getTodos);
router.post('/', validateBody(todoSchema), TodosController.createTodo);
router.patch('/:id', TodosController.updateTodo);
router.patch('/:id/toggle', TodosController.toggleTodo);
router.delete('/:id', TodosController.deleteTodo);

export default router;
