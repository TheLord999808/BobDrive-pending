import User from './User';
import File from './File';
import Folder from './Folder';
import sequelize from '../connection';

// Define model relationships
User.hasMany(File, { foreignKey: 'ownerId', as: 'files' });
User.hasMany(Folder, { foreignKey: 'ownerId', as: 'folders' });

File.belongsTo(Folder, { foreignKey: 'parentFolderId', as: 'folder' });
Folder.hasMany(File, { foreignKey: 'parentFolderId', as: 'files' });

export {
  sequelize,
  User,
  File,
  Folder
};