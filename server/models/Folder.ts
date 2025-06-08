import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface FolderAttributes {
  id: number; // Changé de string à number car c'est un INTEGER autoIncrement
  name: string;
  parentId: number | null; // Changé de string à number
  ownerId: number; // Changé de string à number
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type pour la création (id optionnel car généré automatiquement)
type FolderCreationAttributes = Optional<FolderAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class Folder extends Model<FolderAttributes, FolderCreationAttributes> implements FolderAttributes {
  public id!: number; // Changé de string à number
  public name!: string;
  public parentId!: number | null; // Changé de string à number
  public ownerId!: number; // Changé de string à number
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Folder.init(
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
    parentId: {
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
    modelName: 'folder',
    tableName: 'folders',
  }
);

// Self-referencing association for parent-child relationship
Folder.hasMany(Folder, {
  as: 'children',
  foreignKey: 'parentId',
});

Folder.belongsTo(Folder, {
  as: 'parent',
  foreignKey: 'parentId',
});

export default Folder;
export type { FolderAttributes, FolderCreationAttributes };