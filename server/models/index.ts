import Folder from './Folder';
import File from './File';

// Define model relationships
Folder.hasMany(File, {
  foreignKey: 'folderId',
  as: 'files',
});

File.belongsTo(Folder, {
  foreignKey: 'folderId',
  as: 'folder',
});

export {
  Folder,
  File,
};