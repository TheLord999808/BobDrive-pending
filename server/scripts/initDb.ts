import { sequelize } from '../config/database';
import { Folder, File } from '../models';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const initializeDatabase = async () => {
  try {
    // Sync models with database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create root folder
    const rootFolder = await Folder.create({
      id: uuidv4(),
      name: 'My Files',
      parentId: null,
    });

    // Create sample folders
    const documentsFolder = await Folder.create({
      id: uuidv4(),
      name: 'Documents',
      parentId: rootFolder.id,
    });

    const imagesFolder = await Folder.create({
      id: uuidv4(),
      name: 'Images',
      parentId: rootFolder.id,
    });

    const videosFolder = await Folder.create({
      id: uuidv4(),
      name: 'Videos',
      parentId: rootFolder.id,
    });

    const musicFolder = await Folder.create({
      id: uuidv4(),
      name: 'Music',
      parentId: rootFolder.id,
    });

    // Create sample files in the root folder
    await File.create({
      id: uuidv4(),
      name: 'Notes.txt',
      type: 'text',
      mimetype: 'text/plain',
      size: 8 * 1024, // 8 KB
      path: '/storage/placeholder_notes.txt',
      folderId: rootFolder.id,
    });

    await File.create({
      id: uuidv4(),
      name: 'Report.pdf',
      type: 'document',
      mimetype: 'application/pdf',
      size: 1.2 * 1024 * 1024, // 1.2 MB
      path: '/storage/placeholder_report.pdf',
      folderId: rootFolder.id,
    });

    // Create sample files in Documents folder
    await File.create({
      id: uuidv4(),
      name: 'Project Proposal.docx',
      type: 'document',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 245 * 1024, // 245 KB
      path: '/storage/placeholder_proposal.docx',
      folderId: documentsFolder.id,
    });

    await File.create({
      id: uuidv4(),
      name: 'Meeting Notes.txt',
      type: 'text',
      mimetype: 'text/plain',
      size: 12 * 1024, // 12 KB
      path: '/storage/placeholder_meeting_notes.txt',
      folderId: documentsFolder.id,
    });

    await File.create({
      id: uuidv4(),
      name: 'Budget.xlsx',
      type: 'document',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 154 * 1024, // 154 KB
      path: '/storage/placeholder_budget.xlsx',
      folderId: documentsFolder.id,
    });

    // Create placeholder files in storage directory
    const storageDir = path.join(__dirname, '../../storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Create placeholder text files
    fs.writeFileSync(
      path.join(storageDir, 'placeholder_notes.txt'),
      'This is a placeholder notes file created for demonstration purposes.'
    );

    fs.writeFileSync(
      path.join(storageDir, 'placeholder_meeting_notes.txt'),
      'This is a placeholder meeting notes file created for demonstration purposes.'
    );

    // Create empty placeholder files for other types
    fs.writeFileSync(path.join(storageDir, 'placeholder_report.pdf'), '');
    fs.writeFileSync(path.join(storageDir, 'placeholder_proposal.docx'), '');
    fs.writeFileSync(path.join(storageDir, 'placeholder_budget.xlsx'), '');

    console.log('Database initialized with sample data');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// Run the initialization
initializeDatabase();