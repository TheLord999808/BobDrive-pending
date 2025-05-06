import express from 'express';
import { User } from '../db/models';
import { v4 as uuidv4 } from 'uuid';

// Create router
const router = express.Router();

// GET /api/v1/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'displayName', 'isActive', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/v1/users/:id - Get a specific user
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'displayName', 'isActive', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/v1/users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { username, email, displayName } = req.body;
    
    if (!username || !email || !displayName) {
      return res.status(400).json({ error: 'Username, email, and display name are required' });
    }
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [sequelize.Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    const user = await User.create({
      username,
      email,
      displayName,
      isActive: true
    });
    
    return res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/v1/users/:id - Update a user
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { displayName, isActive } = req.body;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update only allowed fields
    const updates: Record<string, any> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (isActive !== undefined) updates.isActive = isActive;
    
    // Apply updates
    await user.update(updates);
    
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/v1/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Instead of hard delete, we can soft delete by setting isActive to false
    await user.update({ isActive: false });
    
    return res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

export { router as userRoutes };