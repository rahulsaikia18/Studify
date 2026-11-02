import { Router } from 'express';
import { PDFController, pdfUpload } from '../controllers/pdf.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/merge', pdfUpload.array('files', 10), PDFController.merge);
router.post('/split', pdfUpload.single('file'), PDFController.split);
router.post('/extract', pdfUpload.single('file'), PDFController.extract);
router.post('/compress', pdfUpload.single('file'), PDFController.compress);
router.post('/preview', pdfUpload.single('file'), PDFController.preview);

export default router;
