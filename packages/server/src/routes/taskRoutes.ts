import express from 'express';
import { 
  createTask, 
  getUnitTasks, 
  getTask, 
  updateTaskStatus, 
  assignTask, 
  getMediaUploadUrl,
  deleteTask
} from '../controllers/taskController';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all task routes
router.use(authenticateUser);

// Task routes
router.post('/', createTask);
router.get('/unit/:unitId', getUnitTasks);
router.get('/:taskId', getTask);
router.patch('/:taskId/status', updateTaskStatus);
router.patch('/:taskId/assign', assignTask);
router.post('/:taskId/media-upload-url', getMediaUploadUrl);
router.delete('/:taskId', deleteTask);

export default router;