// packages/server/src/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Error registering user' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Error logging in' });
  }
};

// Test login (for debugging only, do not use in production)
export const testLogin = async (req: Request, res: Response) => {
  try {
    // Create a test user object
    const testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser'
    };

    // Generate JWT token with the test user data
    const token = jwt.sign(
      testUser,
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Generated test token:', token);

    return res.status(200).json({
      message: 'Test login successful',
      token,
      user: testUser
    });
  } catch (error) {
    console.error('Error in test login:', error);
    return res.status(500).json({ message: 'Error in test login' });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ message: 'Error fetching user data' });
  }
};