import express from 'express';
import { Op, ValidationError, UniqueConstraintError } from 'sequelize';
import User from '../models/User';

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
        [Op.or]: [
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
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    
    // Gestion d'erreur plus spécifique pour les erreurs de validation Sequelize
    if (error instanceof ValidationError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors.map((e) => ({ field: e.path, message: e.message }))
      });
    }
    
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
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
    const updates: Partial<{ displayName: string; isActive: boolean }> = {}; // Type plus précis
    if (displayName !== undefined) updates.displayName = displayName;
    if (isActive !== undefined) updates.isActive = isActive;
    
    // Vérifier qu'il y a au moins une mise à jour
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Apply updates
    await user.update(updates);
    
    // Recharger l'utilisateur pour avoir les données à jour
    await user.reload();
    
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    
    // Gestion d'erreur pour les erreurs de validation
    if (error instanceof ValidationError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors.map((e) => ({ field: e.path, message: e.message }))
      });
    }
    
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/v1/users/:id - Delete a user (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Vérifier si l'utilisateur est déjà désactivé
    if (!user.isActive) {
      return res.status(400).json({ error: 'User is already deactivated' });
    }
    
    // Soft delete by setting isActive to false
    await user.update({ isActive: false });
    
    return res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

export default router;