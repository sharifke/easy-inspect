import { Request, Response, NextFunction } from 'express';

/**
 * Admin middleware
 * Checks if authenticated user has ADMIN role
 * Must be used AFTER authenticate middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = (req as any).user;

    // Check if user is authenticated
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated. Please log in first.',
      });
      return;
    }

    // Check if user has ADMIN role
    if (user.role !== 'ADMIN') {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // User is admin, proceed to next middleware/controller
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during authorization',
    });
  }
};
