import User from './User';
import Folder from './Folder';
import File from './File';

// Define model relationships

// User relationships
User.hasMany(Folder, {
  foreignKey: 'ownerId',
  as: 'folders',
  onDelete: 'CASCADE',
});

User.hasMany(File, {
  foreignKey: 'ownerId',
  as: 'files',
  onDelete: 'CASCADE',
});

// Folder relationships
Folder.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
});

Folder.hasMany(Folder, {
  as: 'children',
  foreignKey: 'parentId',
  onDelete: 'CASCADE',
});

Folder.belongsTo(Folder, {
  as: 'parent',
  foreignKey: 'parentId',
});

Folder.hasMany(File, {
  foreignKey: 'folderId',
  as: 'files',
  onDelete: 'SET NULL',
});

// File relationships
File.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
});

File.belongsTo(Folder, {
  foreignKey: 'folderId',
  as: 'folder',
});

export {
  User,
  Folder,
  File,
};