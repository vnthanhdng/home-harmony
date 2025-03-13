import express from 'express';
import {
  createUnit,
  getUserUnits,
  getUnitDetails,
  updateUnit,
  deleteUnit
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

export default router;