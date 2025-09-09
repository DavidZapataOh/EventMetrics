import express from 'express';
import {
    getUserOrganizations,
    switchOrganization,
    createOrganizationRequest,
    getUserOrganizationRequests,
    approveOrganizationRequest,
    rejectOrganizationRequest
} from '../../handlers/organizationHandler';
import authMiddleware from '../../middleware/authMiddleware';
import adminMiddleware from '../../middleware/adminMiddleware';
import { uploadToS3 } from '../../services/uploadService';

const router = express.Router();

router.get('/user-organizations', authMiddleware, getUserOrganizations as any);
router.post('/switch', authMiddleware, switchOrganization as any);
router.post('/request', authMiddleware, uploadToS3.single('logo'), createOrganizationRequest as any);
router.get('/requests', authMiddleware, getUserOrganizationRequests as any);

router.post('/requests/:requestId/approve', [authMiddleware, adminMiddleware], approveOrganizationRequest as any);
router.post('/requests/:requestId/reject', [authMiddleware, adminMiddleware], rejectOrganizationRequest as any);

export default router;