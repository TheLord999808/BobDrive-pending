import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAttributes {
  id: number; // Changé de string à number car c'est un INTEGER autoIncrement
  username: string;
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type pour la création d'utilisateur (id optionnel car généré automatiquement)
type UserCreationAttributes = Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number; // Changé de string à number
  public username!: string;
  public email!: string;
  public displayName!: string;
  public isActive!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'user',
    tableName: 'users',
  }
);

export default User;
export type { UserAttributes, UserCreationAttributes };