import express from 'express';
import { geocodeAddress } from '../controllers/geoEncController.js';

const router = express.Router();

router.post('/', geocodeAddress);

export default router;
