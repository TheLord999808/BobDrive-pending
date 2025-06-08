import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { File, Folder } from '../models';

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

// GET /api/v1/files - Get all files for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const parentFolderId = req.query.parentFolderId as string | undefined;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const query: { ownerId: string; parentFolderId?: string | null } = { ownerId: userId };
    if (parentFolderId) {
      query.parentFolderId = parentFolderId;
    } else {
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

// POST /api/v1/files - Upload a file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { userId, parentFolderId, isPublic } = req.body;
    
    if (!req.file || !userId) {
      return res.status(400).json({ error: 'File and user ID are required' });
    }

    // Verify parent folder exists if specified
    if (parentFolderId && parentFolderId !== 'null') {
      const parentFolder = await Folder.findByPk(parentFolderId);
      if (!parentFolder) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }

    const file = await File.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      filePath: req.file.path,
      ownerId: userId,
      parentFolderId: (parentFolderId && parentFolderId !== 'null') ? parentFolderId : null,
      isPublic: isPublic === 'true' || isPublic === true
    });

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
    
    // Remove file from filesystem
    try {
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
    } catch (fsError) {
      console.warn('Warning: Could not delete file from filesystem:', fsError);
    }
    
    // Remove from database
    await file.destroy();
    
    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

// PATCH /api/v1/files/:id - Update a file
router.patch('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { originalName, isPublic, parentFolderId } = req.body;
    
    const file = await File.findByPk(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Verify parent folder exists if specified
    if (parentFolderId && parentFolderId !== 'null') {
      const parentFolder = await Folder.findByPk(parentFolderId);
      if (!parentFolder) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }
    
    // Update only allowed fields
    const updates: Partial<{ originalName: string; isPublic: boolean; parentFolderId: string | null }> = {};
    if (originalName !== undefined) updates.originalName = originalName;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (parentFolderId !== undefined) {
      updates.parentFolderId = (parentFolderId === 'null' || parentFolderId === null) ? null : parentFolderId;
    }
    
    await file.update(updates);
    
    return res.status(200).json(file);
  } catch (error) {
    console.error('Error updating file:', error);
    return res.status(500).json({ error: 'Failed to update file' });
  }
});

export default router;