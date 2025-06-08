import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { File, Folder } from '../models';

// Helper function to convert bytes to human-readable format
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

// Helper function to determine file type
const getFileType = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('text/')) return 'text';
  if (mimetype.includes('pdf')) return 'document';
  if (mimetype.includes('word') || mimetype.includes('excel') || mimetype.includes('powerpoint')) return 'document';
  return 'file';
};

export const getFileSystem = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get root folders and files
    const rootFolders = await Folder.findAll({
      where: { parentId: null },
      include: [
        {
          model: Folder,
          as: 'children',
        },
      ],
    });

    const rootFiles = await File.findAll({
      where: { folderId: null },
    });

    res.status(200).json({
      folders: rootFolders,
      files: rootFiles,
    });
  } catch (error) {
    console.error('Error getting file system:', error);
    res.status(500).json({ error: 'Failed to retrieve file system' });
  }
};

export const getFolderContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    const subfolders = await Folder.findAll({
      where: { parentId: folderId },
    });

    const files = await File.findAll({
      where: { folderId },
    });

    res.status(200).json({
      folder,
      subfolders,
      files,
    });
  } catch (error) {
    console.error('Error getting folder contents:', error);
    res.status(500).json({ error: 'Failed to retrieve folder contents' });
  }
};

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Folder name is required' });
      return;
    }

    // Check if folder with the same name exists in the same location
    const existingFolder = await Folder.findOne({
      where: {
        name,
        parentId: parentId || null,
      },
    });

    if (existingFolder) {
      res.status(409).json({ error: 'A folder with this name already exists in this location' });
      return;
    }

    const folder = await Folder.create({
        name,
        parentId: parentId || null,
        ownerId: ownerId, // À ajouter depuis req.body ou auth
        isPublic: false,
    });
      
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
};

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { originalname, mimetype, size, filename } = req.file;
    const { folderId } = req.body;

    // Generate a unique filename
    const fileExtension = path.extname(originalname);
    const fileNameWithoutExt = path.basename(originalname, fileExtension);
    const uniqueFileName = `${fileNameWithoutExt}-${uuidv4()}${fileExtension}`;
    
    // Store file info in database
    const fileRecord = await File.create({
        name: originalname,
        originalName: originalname,
        type: getFileType(mimetype),
        mimetype,
        size,
        path: `/storage/${uniqueFileName}`,
        folderId: folderId || null,
        ownerId: ownerId, // À ajouter depuis req.body ou auth
        isPublic: false,
      });

    // Move the file to the storage directory with the unique name
    const oldPath = path.join(__dirname, '../../uploads', filename);
    const newPath = path.join(__dirname, '../../storage', uniqueFileName);
    
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        console.error('Error moving file:', err);
        res.status(500).json({ error: 'Failed to move uploaded file' });
        return;
      }
      
      res.status(201).json({
        ...fileRecord.toJSON(),
        size: formatFileSize(size),
      });
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;

    const file = await File.findByPk(fileId);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Delete the file from storage
    const filePath = path.join(__dirname, '../..', file.path);
    fs.unlink(filePath, async (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting file from storage:', err);
        res.status(500).json({ error: 'Failed to delete file from storage' });
        return;
      }

      // Delete the file record from database
      await file.destroy();
      res.status(200).json({ message: 'File deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Check if folder has files or subfolders
    const files = await File.findAll({ where: { folderId } });
    const subfolders = await Folder.findAll({ where: { parentId: folderId } });

    if (files.length > 0 || subfolders.length > 0) {
      res.status(409).json({ error: 'Cannot delete folder with files or subfolders' });
      return;
    }

    // Delete the folder
    await folder.destroy();
    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
};

export const renameFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const { newName } = req.body;

    if (!newName) {
      res.status(400).json({ error: 'New name is required' });
      return;
    }

    const file = await File.findByPk(fileId);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    file.name = newName;
    await file.save();

    res.status(200).json(file);
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
};

export const renameFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;
    const { newName } = req.body;

    if (!newName) {
      res.status(400).json({ error: 'New name is required' });
      return;
    }

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Check if folder with the same name exists in the same location
    const existingFolder = await Folder.findOne({
      where: {
        name: newName,
        parentId: folder.parentId,
        id: { [Op.ne]: folderId },
      },
    });

    if (existingFolder) {
      res.status(409).json({ error: 'A folder with this name already exists in this location' });
      return;
    }

    folder.name = newName;
    await folder.save();

    res.status(200).json(folder);
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ error: 'Failed to rename folder' });
  }
};

export const moveFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const { targetFolderId } = req.body;

    const file = await File.findByPk(fileId);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // If targetFolderId is provided, check if the folder exists
    if (targetFolderId) {
      const targetFolder = await Folder.findByPk(targetFolderId);
      if (!targetFolder) {
        res.status(404).json({ error: 'Target folder not found' });
        return;
      }
    }

    file.folderId = targetFolderId || null;
    await file.save();

    res.status(200).json(file);
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ error: 'Failed to move file' });
  }
};

export const moveFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;
    const { targetFolderId } = req.body;

    if (folderId === targetFolderId) {
      res.status(400).json({ error: 'Cannot move folder into itself' });
      return;
    }

    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // If targetFolderId is provided, check if the target folder exists
    if (targetFolderId) {
      const targetFolder = await Folder.findByPk(targetFolderId);
      if (!targetFolder) {
        res.status(404).json({ error: 'Target folder not found' });
        return;
      }

      // Check if target folder is a descendant of the folder being moved
      let currentFolder = targetFolder;
      while (currentFolder.parentId) {
        if (currentFolder.parentId === folderId) {
          res.status(400).json({ error: 'Cannot move a folder into its own descendant' });
          return;
        }
        currentFolder = await Folder.findByPk(currentFolder.parentId);
      }
    }

    folder.parentId = targetFolderId || null;
    await folder.save();

    res.status(200).json(folder);
  } catch (error) {
    console.error('Error moving folder:', error);
    res.status(500).json({ error: 'Failed to move folder' });
  }
};