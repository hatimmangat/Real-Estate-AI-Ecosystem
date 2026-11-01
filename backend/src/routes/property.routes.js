import express from 'express';
import {
    createProperty,
    updateProperty,
    deleteProperty,
    getAgentProperties,
    getPropertyById,
    getPropertyByIdForEdit,
    getAllProperties,
    getPropertiesByAgent,
} from '../controllers/propertyController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();


router.get('/', getAllProperties);
router.post('/create', authenticate, createProperty);
router.put('/:id', authenticate, updateProperty);
router.delete('/:id', authenticate, deleteProperty);
router.get('/my-properties', authenticate, getAgentProperties);
router.get('/edit/:id', authenticate, getPropertyByIdForEdit);
router.get('/:id', getPropertyById);
router.get('/agent/:agentId', getPropertiesByAgent);

export default router;
