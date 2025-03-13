import express from 'express';
import {
  inviteUser,
  updateMemberRole,
  removeMember
} from '../controllers/unitController'; // Still importing from unitController
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Member management routes
router.post('/units/:id/members', inviteUser);
router.put('/units/:id/members/:memberId', updateMemberRole);
router.delete('/units/:id/members/:memberId', removeMember);

export default router;