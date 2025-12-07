import { Router } from 'express';
import { login, register, getMe, getUsers, updateUser, deleteUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (Admin can create users)
 */
router.post('/register', register);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/users', authenticate, getUsers);

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/users/:id', authenticate, updateUser);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/users/:id', authenticate, deleteUser);

export default router;
