import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getFileSystem,
  getFolderContents,
  createFolder,
  uploadFile,
  deleteFile,
  deleteFolder,
  renameFile,
  renameFolder,
  moveFile,
  moveFolder,
} from '../controllers/fileController';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const storageDir = path.join(__dirname, '../../storage');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// File and folder endpoints
router.get('/files', getFileSystem);
router.get('/folders/:folderId', getFolderContents);
router.post('/folders', createFolder);
router.post('/files', upload.single('file'), uploadFile);
router.delete('/files/:fileId', deleteFile);
router.delete('/folders/:folderId', deleteFolder);
router.put('/files/:fileId/rename', renameFile);
router.put('/folders/:folderId/rename', renameFolder);
router.put('/files/:fileId/move', moveFile);
router.put('/folders/:folderId/move', moveFolder);

export default router;