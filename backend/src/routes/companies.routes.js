import express from 'express';
import {
  createProfile,
  updateProfile,
  getProfile,
  getAllProfiles,
  getProfileById,
  getTopCompanies
} from '../controllers/companyController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/profile/create', authenticate, createProfile);
router.post('/profile/update', authenticate, updateProfile);
router.get('/profile', authenticate, getProfile);
router.get('/profiles', getAllProfiles);
router.get('/profile/:id', getProfileById);
router.get('/top-companies', getTopCompanies);

export default router;
