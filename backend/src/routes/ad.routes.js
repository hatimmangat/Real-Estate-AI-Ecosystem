import express from 'express';
import {
    createAd,
    getAllAds,
    getUserAds,
    getAdById,
    updateAd,
    deleteAd
} from '../controllers/adController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create', authenticate, createAd);
router.get('/', getAllAds);
router.get('/my-ads', authenticate, getUserAds);
router.get('/:id', getAdById);
router.put('/:id', authenticate, updateAd);
router.delete('/:id', authenticate, deleteAd);

export default router;
