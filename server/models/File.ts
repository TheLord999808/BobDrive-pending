import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Folder from './Folder';

interface FileAttributes {
  id: string;
  name: string;
  type: string;
  mimetype: string;
  size: number;
  path: string;
  folderId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FileCreationAttributes extends Optional<FileAttributes, 'id'> {}

class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: string;
  public name!: string;
  public type!: string;
  public mimetype!: string;
  public size!: number;
  public path!: string;
  public folderId!: string | null;
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
    type: {
      type: DataTypes.STRING, // e.g., document, image, video, audio, text
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
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
  },
  {
    sequelize,
    modelName: 'file',
    tableName: 'files',
  }
);

export default File;