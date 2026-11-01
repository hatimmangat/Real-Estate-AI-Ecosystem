import express from 'express';
import {
    getInvestmentOpportunities,
    predictProperty,
    getMLServiceHealth
} from '../controllers/investmentController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/opportunities', getInvestmentOpportunities);


router.post('/predict-property', predictProperty);

router.get('/health', getMLServiceHealth);

export default router;
