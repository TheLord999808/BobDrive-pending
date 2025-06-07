import dotenv from 'dotenv';
import { sequelize, User, Folder } from '../models';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

async function initializeDb() {
  try {
    console.log('Initializing database...');
    
    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');
    
    // Create a default user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      displayName: 'Administrator',
      isActive: true
    });
    
    console.log(`Created admin user with ID: ${adminUser.id}`);
    
    // Create some default folders
    const documentsFolder = await Folder.create({
      name: 'Documents',
      ownerId: adminUser.id,
      isPublic: false
    });
    
    const imagesFolder = await Folder.create({
      name: 'Images',
      ownerId: adminUser.id,
      isPublic: true
    });
    
    const workFolder = await Folder.create({
      name: 'Work',
      ownerId: adminUser.id,
      parentFolderId: documentsFolder.id,
      isPublic: false
    });
    
    console.log('Created default folders');
    console.log('Database initialization complete!');
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the initialization
initializeDb()
  .then(() => {
    console.log('Database setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });