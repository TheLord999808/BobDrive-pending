import express from 'express';
import { Folder, File } from '../db/models';
import sequelize from '../db/connection';

// Create router
const router = express.Router();

// GET /api/v1/folders - Get all folders for a user
router.get('/', async (req, res) => {
  try {
    // Usually would get userId from auth token
    const userId = req.query.userId as string;
    const parentFolderId = req.query.parentFolderId as string | undefined;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const query: any = { ownerId: userId };
    if (parentFolderId) {
      query.parentFolderId = parentFolderId;
    } else {
      // Root level folders (null parentFolderId)
      query.parentFolderId = null;
    }

    const folders = await Folder.findAll({
      where: query,
      order: [['name', 'ASC']]
    });

    return res.status(200).json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// GET /api/v1/folders/:id - Get a specific folder
router.get('/:id', async (req, res) => {
  try {
    const folderId = req.params.id;
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    return res.status(200).json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    return res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

// GET /api/v1/folders/:id/contents - Get folder contents (subfolders and files)
router.get('/:id/contents', async (req, res) => {
  try {
    const folderId = req.params.id;
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Get subfolders
    const subfolders = await Folder.findAll({
      where: { parentFolderId: folderId },
      order: [['name', 'ASC']]
    });
    
    // Get files
    const files = await File.findAll({
      where: { parentFolderId: folderId },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      folder,
      subfolders,
      files
    });
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    return res.status(500).json({ error: 'Failed to fetch folder contents' });
  }
});

// POST /api/v1/folders - Create a new folder
router.post('/', async (req, res) => {
  try {
    const { name, userId, parentFolderId, isPublic } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({ error: 'Folder name and user ID are required' });
    }
    
    // Check if folder already exists in the same parent
    const existingFolder = await Folder.findOne({
      where: {
        name,
        ownerId: userId,
        parentFolderId: parentFolderId || null
      }
    });
    
    if (existingFolder) {
      return res.status(409).json({ error: 'Folder already exists in this location' });
    }
    
    const folder = await Folder.create({
      name,
      ownerId: userId,
      parentFolderId: parentFolderId || null,
      isPublic: isPublic === 'true' || isPublic === true
    });
    
    return res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
});

// PATCH /api/v1/folders/:id - Update a folder
router.patch('/:id', async (req, res) => {
  try {
    const folderId = req.params.id;
    const { name, isPublic, parentFolderId } = req.body;
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Prevent circular references
    if (parentFolderId && parentFolderId === folderId) {
      return res.status(400).json({ error: 'A folder cannot be its own parent' });
    }
    
    // Check if moving to child folder (would create circular reference)
    if (parentFolderId) {
      const isChildFolder = await checkIsChildFolder(folderId, parentFolderId);
      if (isChildFolder) {
        return res.status(400).json({ error: 'Cannot move a folder to its own subfolder' });
      }
    }
    
    // Update only allowed fields
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (parentFolderId !== undefined) updates.parentFolderId = parentFolderId || null;
    
    // Apply updates
    await folder.update(updates);
    
    return res.status(200).json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return res.status(500).json({ error: 'Failed to update folder' });
  }
});

// DELETE /api/v1/folders/:id - Delete a folder
router.delete('/:id', async (req, res) => {
  try {
    const folderId = req.params.id;
    const recursive = req.query.recursive === 'true';
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Check if folder has contents
    const subfolders = await Folder.findAll({ where: { parentFolderId: folderId } });
    const files = await File.findAll({ where: { parentFolderId: folderId } });
    
    if ((subfolders.length > 0 || files.length > 0) && !recursive) {
      return res.status(400).json({ 
        error: 'Folder is not empty. Use recursive=true to delete all contents.',
        hasContents: true,
        subfolderCount: subfolders.length,
        fileCount: files.length
      });
    }
    
    // If recursive, delete all contents
    if (recursive) {
      await deleteRecursive(folderId);
    }
    
    // Delete the folder itself
    await folder.destroy();
    
    return res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Helper function to check if a folder is a child of another folder
async function checkIsChildFolder(parentId: string, suspectedChildId: string): Promise<boolean> {
  // Base case
  if (parentId === suspectedChildId) {
    return true;
  }
  
  // Get all direct children of the suspected child
  const childFolders = await Folder.findAll({
    where: { parentFolderId: suspectedChildId }
  });
  
  // If no children, return false
  if (childFolders.length === 0) {
    return false;
  }
  
  // Check each child recursively
  for (const child of childFolders) {
    const isChildFolder = await checkIsChildFolder(parentId, child.id);
    if (isChildFolder) {
      return true;
    }
  }
  
  return false;
}

// Helper function to recursively delete a folder and its contents
async function deleteRecursive(folderId: string): Promise<void> {
  // Get all subfolders
  const subfolders = await Folder.findAll({ where: { parentFolderId: folderId } });
  
  // Recursively delete each subfolder
  for (const subfolder of subfolders) {
    await deleteRecursive(subfolder.id);
  }
  
  // Get all files in the folder
  const files = await File.findAll({ where: { parentFolderId: folderId } });
  
  // Delete each file
  for (const file of files) {
    // Remove file from filesystem if it exists
    const fs = require('fs');
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    // Remove from database
    await file.destroy();
  }
}

export { router as folderRoutes };