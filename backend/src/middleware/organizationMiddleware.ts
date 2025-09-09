import { Request, Response, NextFunction } from 'express';
import OrganizationMembership from '../models/OrganizationMembership';

interface AuthenticatedRequest extends Request {
    user: any;
}

export const organizationMiddleware = async (req: any, res: any, next: any) => {
    try {
        const user = req.user;
        
        if (!user.currentOrganizationId) {
            return res.status(403).json({ 
                message: 'Organization context required. Please select an organization.' 
            });
        }

        const membership = await OrganizationMembership.findOne({
            userId: user._id,
            organizationId: user.currentOrganizationId,
            status: 'active'
        });

        if (!membership) {
            return res.status(403).json({ 
                message: 'You do not have access to this organization' 
            });
        }

        req.user.membership = membership;
        next();
    } catch (error) {
        console.error('Error in organization middleware:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export default organizationMiddleware;