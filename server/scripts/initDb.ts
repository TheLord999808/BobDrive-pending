import { sequelize } from '../config/database';
import { Folder, File, User } from '../models';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const initializeDatabase = async () => {
  try {
    // Sync models with database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      displayName: 'Administrator',
      isActive: true
    });

    // Create root folder
    const rootFolder = await Folder.create({
      name: 'My Files',
      ownerId: adminUser.id,
      parentFolderId: null,
      isPublic: false
    });

    // Create sample folders
    const documentsFolder = await Folder.create({
      name: 'Documents',
      ownerId: adminUser.id,
      parentFolderId: rootFolder.id,
      isPublic: false
    });

    const imagesFolder = await Folder.create({
      name: 'Images',
      ownerId: adminUser.id,
      parentFolderId: rootFolder.id,
      isPublic: true
    });

    const videosFolder = await Folder.create({
      name: 'Videos',
      ownerId: adminUser.id,
      parentFolderId: rootFolder.id,
      isPublic: false
    });

    const musicFolder = await Folder.create({
      name: 'Music',
      ownerId: adminUser.id,
      parentFolderId: rootFolder.id,
      isPublic: false
    });

    // Create storage directory
    const storageDir = path.join(__dirname, '../../storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Create placeholder text files
    const notesContent = 'This is a placeholder notes file created for demonstration purposes.';
    const notesPath = path.join(storageDir, 'placeholder_notes.txt');
    fs.writeFileSync(notesPath, notesContent);

    const meetingNotesContent = 'Meeting Notes:\n1. Discussed project timeline\n2. Assigned tasks\n3. Next meeting scheduled';
    const meetingNotesPath = path.join(storageDir, 'placeholder_meeting_notes.txt');
    fs.writeFileSync(meetingNotesPath, meetingNotesContent);

    // Create empty placeholder files for other types
    fs.writeFileSync(path.join(storageDir, 'placeholder_report.pdf'), '');
    fs.writeFileSync(path.join(storageDir, 'placeholder_proposal.docx'), '');
    fs.writeFileSync(path.join(storageDir, 'placeholder_budget.xlsx'), '');

    // Create sample files in the root folder
    await File.create({
      fileName: 'placeholder_notes.txt',
      originalName: 'Notes.txt',
      mimeType: 'text/plain',
      size: Buffer.byteLength(notesContent, 'utf8'),
      path: notesPath,
      ownerId: adminUser.id,
      parentFolderId: rootFolder.id,
      isPublic: false
    });

    await File.create({
      fileName: 'placeholder_report.pdf',
      originalName: 'Report.pdf',
      mimeType: 'application/pdf',
      size: 1.2 * 1024 * 1024, // 1.2 MB
      path: path.join(storageDir, 'placeholder_report.pdf'),
      ownerId: adminUser.id,
      parentFolderId: rootFolder.id,
      isPublic: false
    });

    // Create sample files in Documents folder
    await File.create({
      fileName: 'placeholder_proposal.docx',
      originalName: 'Project Proposal.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 245 * 1024, // 245 KB
      path: path.join(storageDir, 'placeholder_proposal.docx'),
      ownerId: adminUser.id,
      parentFolderId: documentsFolder.id,
      isPublic: false
    });

    await File.create({
      fileName: 'placeholder_meeting_notes.txt',
      originalName: 'Meeting Notes.txt',
      mimeType: 'text/plain',
      size: Buffer.byteLength(meetingNotesContent, 'utf8'),
      path: meetingNotesPath,
      ownerId: adminUser.id,
      parentFolderId: documentsFolder.id,
      isPublic: false
    });

    await File.create({
      fileName: 'placeholder_budget.xlsx',
      originalName: 'Budget.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 154 * 1024, // 154 KB
      path: path.join(storageDir, 'placeholder_budget.xlsx'),
      ownerId: adminUser.id,
      parentFolderId: documentsFolder.id,
      isPublic: false
    });

    console.log('Database initialized with sample data');
    console.log(`Admin user created with ID: ${adminUser.id}`);
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// Run the initialization
initializeDatabase();