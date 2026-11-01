import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createAuction, deleteAuction, getAllAuctions, getAuctionById, getMyAuctions, updateAuction } from '../controllers/auctionController.js';
const router = express.Router();

router.get('/', getAllAuctions);
router.get('/:id', getAuctionById);

router.post('/create', authenticate, createAuction);
router.get('/my/auctions', authenticate, getMyAuctions);
router.delete('/:id', authenticate, deleteAuction);
router.put('/:id', authenticate, updateAuction);
export default router;