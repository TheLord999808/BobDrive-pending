import express from 'express';
import { Folder, File } from '../models';
import * as fs from 'fs';
import type { FolderAttributes } from '../models/Folder';

// Create router
const router = express.Router();

// GET /api/v1/folders - Get all folders for a user
router.get('/', async (req, res) => {
  try {
    // Usually would get userId from auth token
    const userId = req.query.userId as string;
    const parentId = req.query.parentId as string | undefined;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const query: { ownerId: number; parentId?: number | null } = { ownerId: parseInt(userId) };
    if (parentId) {
      query.parentId = parseInt(parentId);
    } else {
      // Root level folders (null parentId)
      query.parentId = null;
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
    const folderId = parseInt(req.params.id);
    
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
    const folderId = parseInt(req.params.id);
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Get subfolders
    const subfolders = await Folder.findAll({
      where: { parentId: folderId },
      order: [['name', 'ASC']]
    });
    
    // Get files
    const files = await File.findAll({
      where: { folderId: folderId },
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
    const { name, userId, parentId, isPublic } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({ error: 'Folder name and user ID are required' });
    }
    
    // Check if folder already exists in the same parent
    const existingFolder = await Folder.findOne({
      where: {
        name,
        ownerId: parseInt(userId),
        parentId: parentId ? parseInt(parentId) : null
      }
    });
    
    if (existingFolder) {
      return res.status(409).json({ error: 'Folder already exists in this location' });
    }
    
    const folder = await Folder.create({
      name: name as string,
      ownerId: parseInt(userId as string),
      parentId: (parentId as string) ? parseInt(parentId as string) : null,
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
    const folderId = parseInt(req.params.id);
    const { name, isPublic, parentId } = req.body;
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Prevent circular references
    if (parentId && parseInt(parentId) === folderId) {
      return res.status(400).json({ error: 'A folder cannot be its own parent' });
    }
    
    // Check if moving to child folder (would create circular reference)
    if (parentId) {
      const isChildFolder = await checkIsChildFolder(folderId, parseInt(parentId));
      if (isChildFolder) {
        return res.status(400).json({ error: 'Cannot move a folder to its own subfolder' });
      }
    }
    
    // Update only allowed fields
    const updates: Partial<Pick<FolderAttributes, 'name' | 'isPublic' | 'parentId'>> = {};
    if (name !== undefined) updates.name = name;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (parentId !== undefined) updates.parentId = parentId ? parseInt(parentId) : null;
    
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
    const folderId = parseInt(req.params.id);
    const recursive = req.query.recursive === 'true';
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Check if folder has contents
    const subfolders = await Folder.findAll({ where: { parentId: folderId } });
    const files = await File.findAll({ where: { folderId: folderId } });
    
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
async function checkIsChildFolder(parentId: number, suspectedChildId: number): Promise<boolean> {
  // Base case
  if (parentId === suspectedChildId) {
    return true;
  }
  
  // Get all direct children of the suspected child
  const childFolders = await Folder.findAll({
    where: { parentId: suspectedChildId }
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
async function deleteRecursive(folderId: number): Promise<void> {
  // Get all subfolders
  const subfolders = await Folder.findAll({ where: { parentId: folderId } });
  
  // Recursively delete each subfolder
  for (const subfolder of subfolders) {
    await deleteRecursive(subfolder.id);
  }
  
  // Get all files in the folder
  const files = await File.findAll({ where: { folderId: folderId } });
  
  // Delete each file
  for (const file of files) {
    // Remove file from filesystem if it exists
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    // Remove from database
    await file.destroy();
  }
  
  // Delete the folder itself
  const folder = await Folder.findByPk(folderId);
  if (folder) {
    await folder.destroy();
  }
}

export default router;