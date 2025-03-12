import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// ,iddleware to verify JWT token
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // check if bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.split(' ')[1];

    // verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string };

    // find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request
    req.user = user;

    // Continue
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if ((error as Error).name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if ((error as Error).name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Optional middleware to check if user is verified
// In a real app, we would check if the user's email/phone is verified
export const isVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // For this demo, we'll just check if the user exists
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // In a real app, we would check if the user is verified
    // For now, we'll just continue
    next();
  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({ message: 'Server error during verification check' });
  }
};