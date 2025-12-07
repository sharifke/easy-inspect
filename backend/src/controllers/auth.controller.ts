import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.active) {
      res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
    });
  }
};

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, companyName, phoneNumber } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        status: 'error',
        message: 'Email, password, first name, and last name are required',
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        status: 'error',
        message: 'A user with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'INSPECTOR',
        companyName,
        phoneNumber,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration',
    });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is already attached to request by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Check if user is active
    if (!user.active) {
      res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated',
      });
      return;
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user data',
    });
  }
};

/**
 * Get all users (Admin only)
 * GET /api/auth/users
 */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Remove passwords from all users
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);

    res.status(200).json({
      status: 'success',
      data: {
        users: usersWithoutPasswords,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching users',
    });
  }
};

/**
 * Update user (Admin only)
 * PUT /api/auth/users/:id
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      res.status(400).json({
        status: 'error',
        message: 'Email, first name, and last name are required',
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // If email is being changed, check if new email is already taken
    if (email.toLowerCase() !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (emailTaken) {
        res.status(409).json({
          status: 'error',
          message: 'A user with this email already exists',
        });
        return;
      }
    }

    // Prepare update data
    const updateData: any = {
      email: email.toLowerCase(),
      firstName,
      lastName,
      role: role || existingUser.role,
    };

    // If password is provided, hash and include it
    if (password) {
      if (password.length < 8) {
        res.status(400).json({
          status: 'error',
          message: 'Password must be at least 8 characters long',
        });
        return;
      }
      updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating user',
    });
  }
};

/**
 * Delete user (Admin only)
 * DELETE /api/auth/users/:id
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.userId;

    // Prevent self-deletion
    if (id === currentUserId) {
      res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account',
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting user',
    });
  }
};
