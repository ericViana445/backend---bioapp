import { Router } from 'express';
import multer from 'multer';
import { uploadPDF } from '../controllers/pdf.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), uploadPDF);

export default router; // 🔥 ISSO AQUI É O MAIS IMPORTANTE