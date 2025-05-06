import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { File } from '../db/models';

// Create router
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../storage');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Basic file type validation
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: File type not supported!'));
    }
  }
});

// Routes
// GET /api/v1/files - Get all files for a user
router.get('/', async (req, res) => {
  try {
    // Usually would get userId from auth token
    const userId = req.query.userId as string;
    const folderId = req.query.folderId as string | undefined;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const query: any = { ownerId: userId };
    if (folderId) {
      query.parentFolderId = folderId;
    } else {
      // Root level files (null parentFolderId)
      query.parentFolderId = null;
    }

    const files = await File.findAll({
      where: query,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// GET /api/v1/files/:id - Get a specific file
router.get('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    
    const file = await File.findByPk(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    return res.status(200).json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    return res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// POST /api/v1/files - Upload a file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId, folderId, isPublic } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const fileData = {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      isPublic: isPublic === 'true',
      ownerId: userId,
      parentFolderId: folderId || null
    };

    const file = await File.create(fileData);
    
    return res.status(201).json(file);
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// DELETE /api/v1/files/:id - Delete a file
router.delete('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    
    const file = await File.findByPk(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Remove from filesystem
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    // Remove from database
    await file.destroy();
    
    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

// PATCH /api/v1/files/:id - Update file metadata
router.patch('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { fileName, isPublic, parentFolderId } = req.body;
    
    const file = await File.findByPk(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Update only allowed fields
    const updates: Record<string, any> = {};
    if (fileName !== undefined) updates.fileName = fileName;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (parentFolderId !== undefined) updates.parentFolderId = parentFolderId || null;
    
    // Apply updates
    await file.update(updates);
    
    return res.status(200).json(file);
  } catch (error) {
    console.error('Error updating file:', error);
    return res.status(500).json({ error: 'Failed to update file' });
  }
});

// GET /api/v1/files/:id/download - Download a file
router.get('/:id/download', async (req, res) => {
  try {
    const fileId = req.params.id;
    
    const file = await File.findByPk(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    // Set content disposition for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    
    // Stream the file
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ error: 'Failed to download file' });
  }
});

export { router as fileRoutes };