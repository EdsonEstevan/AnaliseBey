import crypto from 'crypto';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';

import { badRequest } from '../utils/apiError';
import { uploadsDir } from '../utils/storage';

const uploadsRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname) || '.bin';
    const unique = crypto.randomBytes(8).toString('hex');
    callback(null, `${Date.now()}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(badRequest('Apenas imagens são permitidas.'));
    }
    callback(null, true);
  },
});

uploadsRouter.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    throw badRequest('Arquivo obrigatório.');
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    url: fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

export { uploadsRouter };
