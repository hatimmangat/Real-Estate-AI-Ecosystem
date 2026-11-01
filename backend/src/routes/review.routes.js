import express from 'express';
import { createCompanyReview, getCompanyReviews, updateCompanyReview, deleteCompanyReview, createProfessionalReview, getProfessionalReviews, updateProfessionalReview, deleteProfessionalReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create', authenticate, createCompanyReview);
router.put('/:reviewId', authenticate, updateCompanyReview);
router.delete('/:reviewId', authenticate, deleteCompanyReview);
router.get('/company/:companyId', getCompanyReviews);
router.post('/professional/create', authenticate, createProfessionalReview);
router.get('/professional/:professionalId', getProfessionalReviews);
router.put('/professional/:reviewId', authenticate, updateProfessionalReview);
router.delete('/professional/:reviewId', authenticate, deleteProfessionalReview);
export default router;
