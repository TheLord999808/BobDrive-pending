import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database';
import fileRoutes from './routes/fileRoutes';
import userRoutes from './routes/userRoutes';
import folderRoutes from './routes/folderRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the storage directory
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// API routes
app.use('/api/v1', fileRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/folders', folderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Database connection and server start
const startServer = async () => {
  try {
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();