import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileRoutes } from './routes/fileRoutes';
import { userRoutes } from './routes/userRoutes';
import { folderRoutes } from './routes/folderRoutes';
import { connectToDatabase } from './db/connection';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file storage - for development
// In production, this would point to your VPS storage path
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// API Routes
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/folders', folderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to database and start server
async function startServer() {
  try {
    // Connect to MySQL database
    await connectToDatabase();
    console.log('Connected to MySQL database');
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();