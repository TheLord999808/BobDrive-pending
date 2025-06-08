import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface FileAttributes {
  id: number; // Changé de string à number car c'est un INTEGER autoIncrement
  name: string;
  originalName: string;
  type: string;
  mimetype: string;
  size: number;
  path: string;
  folderId: number | null; // Changé de string à number
  ownerId: number; // Changé de string à number
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type pour la création (propriétés optionnelles)
type FileCreationAttributes = Optional<FileAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isPublic'>;

class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: number; // Changé de string à number
  public name!: string;
  public originalName!: string;
  public type!: string;
  public mimetype!: string;
  public size!: number;
  public path!: string;
  public folderId!: number | null; // Changé de string à number
  public ownerId!: number; // Changé de string à number
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

File.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
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
      type: DataTypes.INTEGER, // Changé de UUID à INTEGER
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id',
      },
    },
    ownerId: {
      type: DataTypes.INTEGER, // Changé de UUID à INTEGER
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
export type { FileAttributes, FileCreationAttributes };