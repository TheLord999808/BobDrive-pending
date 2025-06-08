import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface FileAttributes {
  id: string;
  name: string;
  originalName: string;
  type: string;
  mimetype: string;
  size: number;
  path: string;
  folderId: string | null;
  ownerId: string;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FileCreationAttributes extends Optional<FileAttributes, 'id'> {}

class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: string;
  public name!: string;
  public originalName!: string;
  public type!: string;
  public mimetype!: string;
  public size!: number;
  public path!: string;
  public folderId!: string | null;
  public ownerId!: string;
  public isPublic!: boolean;
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    folderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id',
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
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'file',
    tableName: 'files',
  }
);

export default File;