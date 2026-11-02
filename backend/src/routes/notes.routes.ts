import { Router } from 'express';
import {
  NotesController,
  noteSchema,
} from '../controllers/notes.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.get('/', NotesController.getNotes);
router.post('/', validateBody(noteSchema), NotesController.createNote);
router.patch('/:id', NotesController.updateNote);
router.delete('/:id', NotesController.deleteNote);
router.post('/sync', NotesController.syncNotes);

export default router;
