import { Model, DataTypes } from 'sequelize';
import sequelize from '../connection';
import User from './User';

interface FileAttributes {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  isPublic: boolean;
  ownerId: string;
  parentFolderId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FileCreationAttributes extends Omit<FileAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: string;
  public fileName!: string;
  public originalName!: string;
  public mimeType!: string;
  public size!: number;
  public path!: string;
  public isPublic!: boolean;
  public ownerId!: string;
  public parentFolderId!: string | null;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

File.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
  },
  {
    sequelize,
    tableName: 'files',
    timestamps: true,
  }
);

// Define associations
File.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

export default File;