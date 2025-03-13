import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Public test route
router.get('/public', (req, res) => {
  res.status(200).json({ 
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString()
  });
});

// Protected test route
router.get('/protected', authenticateUser, (req, res) => {
  res.status(200).json({ 
    message: 'You have successfully accessed a protected endpoint',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Auth debug route
router.get('/auth-debug', (req, res) => {
  const authHeader = req.headers.authorization;
  
  res.status(200).json({
    message: 'Auth header debug information',
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? `${authHeader.substring(0, 15)}...` : 'No auth header',
    allHeaders: req.headers,
    timestamp: new Date().toISOString()
  });
});

export default router;