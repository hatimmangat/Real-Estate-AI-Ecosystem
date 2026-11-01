import express from 'express';
import {
  checkAdminRegistration,
  adminSignup,
  adminLogin,
  getAllUsers,
  getUserStatistics
} from '../controllers/adminController.js';
import {
  getAllMaterials,
  getMaterialsByCategory,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  bulkUpdateMaterials,
  initializeDefaultMaterials
} from '../controllers/materialsController.js';
import {
    getContractorFees,
    addContractorFee,
    updateContractorFee,
    deleteContractorFee
} from '../controllers/contractorFeesController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/check-registration', checkAdminRegistration);
router.post('/signup', adminSignup);
router.post('/login', adminLogin);

router.get('/users', authenticate, getAllUsers);
router.get('/users/statistics', authenticate, getUserStatistics);

router.get('/materials', getAllMaterials);
router.get('/materials/:category', getMaterialsByCategory);
router.post('/materials', authenticate, addMaterial);
router.put('/materials/:id', authenticate, updateMaterial);
router.delete('/materials/:id', authenticate, deleteMaterial);
router.post('/materials/bulk-update', authenticate, bulkUpdateMaterials);
router.post('/materials/initialize/defaults', authenticate, initializeDefaultMaterials);

router.get('/contractor-fees', getContractorFees);
router.post('/contractor-fees/add', authenticate, addContractorFee);
router.put('/contractor-fees/:id', authenticate, updateContractorFee);
router.delete('/contractor-fees/:id', authenticate, deleteContractorFee);

export default router;
