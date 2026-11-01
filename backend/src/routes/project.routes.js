import express from 'express';
import {
  createProject,
  getMyProjects,
  getAllProjects,
  getProjectById,
  getProjectsByCompany,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.get('/company/:companyId', getProjectsByCompany);

router.post('/', authenticate, createProject);
router.get('/my/projects', authenticate, getMyProjects);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

export default router;
