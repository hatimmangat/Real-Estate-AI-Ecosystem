import express from 'express';
import { predictHousePrice, checkMLServiceHealth } from '../controllers/housePriceController.js';

const router = express.Router();

router.post('/predict', predictHousePrice);

router.get('/health', checkMLServiceHealth);

export default router;
