import express from 'express';
import {
  getUserInvitations,
  respondToInvitation
} from '../controllers/unitController'; // Still importing from unitController
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Invitation routes
router.get('/invitations', getUserInvitations);
router.put('/invitations/:id', respondToInvitation);

export default router;