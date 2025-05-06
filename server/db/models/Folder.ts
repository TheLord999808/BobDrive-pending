import { Model, DataTypes } from 'sequelize';
import sequelize from '../connection';
import User from './User';

interface FolderAttributes {
  id: string;
  name: string;
  ownerId: string;
  parentFolderId?: string | null;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FolderCreationAttributes extends Omit<FolderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Folder extends Model<FolderAttributes, FolderCreationAttributes> implements FolderAttributes {
  public id!: string;
  public name!: string;
  public ownerId!: string;
  public parentFolderId!: string | null;
  public isPublic!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Folder.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    parentFolderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id',
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'folders',
    timestamps: true,
  }
);

// Define associations
Folder.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Folder.belongsTo(Folder, { foreignKey: 'parentFolderId', as: 'parentFolder' });
Folder.hasMany(Folder, { foreignKey: 'parentFolderId', as: 'subFolders' });

export default Folder;