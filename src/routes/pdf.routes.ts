import { Router } from 'express';
import multer from 'multer';

import { uploadPDF } from '../controllers/pdf.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (file.mimetype !== 'application/pdf') {
      callback(new Error('Apenas arquivos PDF sao permitidos'));
      return;
    }

    callback(null, true);
  },
});

router.post('/upload', upload.single('file'), uploadPDF);

export default router;
