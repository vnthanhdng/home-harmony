import express from 'express';
import {
  createUnit,
  getUserUnits,
  getUnitDetails,
  updateUnit,
  deleteUnit,
  inviteUser,
  updateMemberRole,
  removeMember,
  getUserInvitations,
  respondToInvitation
} from '../controllers/unitController';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Unit management routes
router.post('/units', createUnit);
router.get('/units', getUserUnits);
router.get('/units/:id', getUnitDetails);
router.put('/units/:id', updateUnit);
router.delete('/units/:id', deleteUnit);

// Member management routes
router.post('/units/:id/members', inviteUser);
router.put('/units/:id/members/:memberId', updateMemberRole);
router.delete('/units/:id/members/:memberId', removeMember);

// Invitation routes
router.get('/invitations', getUserInvitations);
router.put('/invitations/:id', respondToInvitation);

export default router;