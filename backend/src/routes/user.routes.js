import express from 'express';
import { login, signup, signupRollback, updateUserProfile, DeleteUserAccount, verifyToken, checkUserExists, getAllProfessionals, getProfessionalById, getUserProfile, saveProfessionalProfile } from '../controllers/userController.js';
import { createProfessionalReview, getProfessionalReviews, updateProfessionalReview, deleteProfessionalReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = express.Router();



router.post('/signup', signup)
router.post('/signup-rollback', signupRollback)
router.post('/login', login)
router.get('/profile', authenticate, getUserProfile)
router.post('/profile/professional', authenticate, saveProfessionalProfile)
router.put('/update-profile', authenticate, updateUserProfile);
router.post('/check-user', checkUserExists);
router.delete('/delete-account', authenticate, DeleteUserAccount)
router.get('/verify', authenticate, verifyToken);
router.get('/professionals', getAllProfessionals);
router.get('/professionals/:id', getProfessionalById);
router.post('/professionals/:id/reviews', authenticate, createProfessionalReview);
router.get('/professionals/:id/reviews', getProfessionalReviews);
router.put('/reviews/:reviewId', authenticate, updateProfessionalReview);
router.delete('/reviews/:reviewId', authenticate, deleteProfessionalReview);
export default router;