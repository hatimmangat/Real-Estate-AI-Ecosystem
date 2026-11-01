import express from 'express';
import { 
  generateInteriorDesign, 
  getGenerationHistory,
  healthCheck 
} from '../controllers/IDController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/health', healthCheck);

router.post('/generate', authenticate, generateInteriorDesign);

router.get('/history', authenticate, getGenerationHistory);

export default router;
