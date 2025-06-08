import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration
export const sequelize = new Sequelize(
  process.env.DB_NAME || 'filemanager',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Function to test the database connection
export async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
    
    // In development mode, sync database models
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized');
    }
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

export default sequelize;