import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface FolderAttributes {
  id: string;
  name: string;
  parentId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FolderCreationAttributes extends Optional<FolderAttributes, 'id'> {}

class Folder extends Model<FolderAttributes, FolderCreationAttributes> implements FolderAttributes {
  public id!: string;
  public name!: string;
  public parentId!: string | null;
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    parentId: {
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