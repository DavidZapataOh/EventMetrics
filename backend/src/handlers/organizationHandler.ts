import { Request, Response } from 'express';
import Organization from '../models/Organization';
import OrganizationMembership from '../models/OrganizationMembership';
import OrganizationRequest from '../models/OrganizationRequest';
import User from '../models/Users';
import telegramService from '../services/telegramService';

interface AuthenticatedRequest extends Request {
    user: any;
    file?: any;
}

export const getUserOrganizations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user._id;

        const memberships = await OrganizationMembership.find({ 
            userId, 
            status: 'active' 
        })
        .populate('organizationId', 'name logo website status')
        .sort({ joinedAt: -1 });

        const organizations = memberships.map(membership => {
            const org = membership.organizationId as any;
            return {
                _id: org._id,
                name: org.name,
                logo: org.logo,
                website: org.website,
                status: org.status,
                membership: {
                    role: membership.role,
                    permissions: membership.permissions,
                    joinedAt: membership.joinedAt
                }
            };
        });

        res.json(organizations);
    } catch (error) {
        console.error('Error fetching user organizations:', error);
        res.status(500).json({ message: 'Error fetching organizations' });
    }
};

export const switchOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { organizationId } = req.body;
        const userId = req.user._id;

        const membership = await OrganizationMembership.findOne({
            userId,
            organizationId,
            status: 'active'
        });

        if (!membership) {
            return res.status(403).json({ message: 'You do not belong to this organization' });
        }

        await User.findByIdAndUpdate(userId, { 
            currentOrganizationId: organizationId 
        });

        const organization = await Organization.findById(organizationId);

        res.json({
            organization: {
                ...organization?.toObject(),
                membership: {
                    role: membership.role,
                    permissions: membership.permissions
                }
            }
        });
    } catch (error) {
        console.error('Error switching organization:', error);
        res.status(500).json({ message: 'Error switching organization' });
    }
};

export const createOrganizationRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            organizationName,
            website,
            twitter,
            description,
            reference,
            requestedRole
        } = req.body;

        const userId = req.user._id;

        const existingRequest = await OrganizationRequest.findOne({
            organizationName: { $regex: new RegExp(`^${organizationName}$`, 'i') },
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ 
                message: 'There is already a pending request for this organization' 
            });
        }

        const existingOrg = await Organization.findOne({
            name: { $regex: new RegExp(`^${organizationName}$`, 'i') }
        });

        if (existingOrg) {
            return res.status(400).json({ 
                message: 'This organization already exists' 
            });
        }

        const requestData: any = {
            organizationName,
            website,
            twitter: twitter ? twitter.replace('@', '') : undefined,
            description,
            reference,
            requestedRole,
            userId
        };

        if (req.file) {
            requestData.logo = {
                key: req.file.key,
                originalName: req.file.originalname,
                size: req.file.size,
                uploadedAt: new Date()
            };
        }

        const orgRequest = new OrganizationRequest(requestData);
        await orgRequest.save();

        try {
            const telegramMessageId = await telegramService.sendOrganizationRequest({
                organizationName,
                website,
                twitter,
                description,
                reference,
                requestedRole,
                requestId: String(orgRequest._id),
                userData: {
                    name: req.user.name,
                    email: req.user.email,
                    handle: req.user.handle
                }
            });

            if (telegramMessageId) {
                orgRequest.telegramMessageId = telegramMessageId;
                await orgRequest.save();
            }
        } catch (telegramError) {
            console.error('Error sending Telegram notification:', telegramError);
        }

        res.status(201).json({
            message: 'Organization request created successfully',
            requestId: orgRequest._id
        });
    } catch (error) {
        console.error('Error creating organization request:', error);
        res.status(500).json({ message: 'Error creating organization request' });
    }
};

export const getUserOrganizationRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user._id;

        const requests = await OrganizationRequest.find({ userId })
            .sort({ createdAt: -1 })
            .select('-telegramMessageId');

        res.json(requests);
    } catch (error) {
        console.error('Error fetching organization requests:', error);
        res.status(500).json({ message: 'Error fetching organization requests' });
    }
};

export const approveOrganizationRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { requestId } = req.params;

        const orgRequest = await OrganizationRequest.findById(requestId)
            .populate('userId', 'name email handle');

        if (!orgRequest) {
            return res.status(404).json({ message: 'Organization request not found' });
        }

        if (orgRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request has already been reviewed' });
        }

        const organization = new Organization({
            name: orgRequest.organizationName,
            logo: orgRequest.logo,
            website: orgRequest.website,
            twitter: orgRequest.twitter,
            description: orgRequest.description,
            reference: orgRequest.reference,
            createdBy: orgRequest.userId,
            approvedBy: req.user._id,
            approvedAt: new Date()
        });

        await organization.save();

        const membership = new OrganizationMembership({
            userId: orgRequest.userId,
            organizationId: organization._id,
            role: orgRequest.requestedRole,
            permissions: orgRequest.requestedRole === 'owner' 
                ? ['read', 'write', 'admin', 'delete'] 
                : ['read', 'write']
        });

        await membership.save();

        const user = await User.findById(orgRequest.userId);
        if (user && !user.currentOrganizationId) {
            user.currentOrganizationId = organization._id as any;
            await user.save();
        }

        orgRequest.status = 'approved';
        orgRequest.reviewedBy = req.user._id;
        orgRequest.reviewedAt = new Date();
        await orgRequest.save();

        if (orgRequest.telegramMessageId) {
            const updatedMessage = `✅ <b>APROBADA</b> - ${orgRequest.organizationName}\n\n` +
                `Aprobada por: ${req.user.name}\n` +
                `Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Bogota' })}`;
            
            await telegramService.updateMessage(
                orgRequest.telegramMessageId,
                updatedMessage
            );
        }

        res.json({
            message: 'Organization request approved successfully',
            organization: organization
        });
    } catch (error) {
        console.error('Error approving organization request:', error);
        res.status(500).json({ message: 'Error approving organization request' });
    }
};

export const rejectOrganizationRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const { rejectionReason } = req.body;

        const orgRequest = await OrganizationRequest.findById(requestId);

        if (!orgRequest) {
            return res.status(404).json({ message: 'Organization request not found' });
        }

        if (orgRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request has already been reviewed' });
        }

        orgRequest.status = 'rejected';
        orgRequest.reviewedBy = req.user._id;
        orgRequest.reviewedAt = new Date();
        orgRequest.rejectionReason = rejectionReason;
        await orgRequest.save();

        if (orgRequest.telegramMessageId) {
            const updatedMessage = `❌ <b>RECHAZADA</b> - ${orgRequest.organizationName}\n\n` +
                `Rechazada por: ${req.user.name}\n` +
                `Razón: ${rejectionReason || 'No especificada'}\n` +
                `Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Bogota' })}`;
            
            await telegramService.updateMessage(
                orgRequest.telegramMessageId,
                updatedMessage
            );
        }

        res.json({
            message: 'Organization request rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting organization request:', error);
        res.status(500).json({ message: 'Error rejecting organization request' });
    }
};

export const handleTelegramWebhook = async (req: Request, res: Response) => {
    try {
        console.log('Telegram webhook received:', JSON.stringify(req.body, null, 2));
        
        const { callback_query } = req.body;
        
        if (!callback_query) {
            return res.status(200).json({ ok: true });
        }

        const { data, from, message } = callback_query;
        const userId = from.id.toString();
        const userName = from.first_name || from.username || 'Usuario';

        console.log(`Action from user ${userName} (${userId}): ${data}`);

        if (!telegramService.isApprover(userId)) {
            console.log(`User ${userId} is not authorized to approve requests`);
            return res.status(200).json({ ok: true });
        }

        const [action, , requestId] = data.split('_');
        
        if (action === 'approve') {
            await handleApprovalFromTelegram(requestId, userId, userName);
        } else if (action === 'reject') {
            await handleRejectionFromTelegram(requestId, userId, userName);
        }

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Error handling Telegram webhook:', error);
        res.status(200).json({ ok: true });
    }
};

const handleApprovalFromTelegram = async (requestId: string, telegramUserId: string, telegramUserName: string) => {
    try {
        console.log(`Processing approval for request ${requestId} by ${telegramUserName}`);

        const orgRequest = await OrganizationRequest.findById(requestId)
            .populate('userId', 'name email handle');

        if (!orgRequest) {
            console.error(`Organization request ${requestId} not found`);
            return;
        }

        if (orgRequest.status !== 'pending') {
            console.log(`Request ${requestId} has already been reviewed`);
            return;
        }

        const organization = new Organization({
            name: orgRequest.organizationName,
            logo: orgRequest.logo,
            website: orgRequest.website,
            twitter: orgRequest.twitter,
            description: orgRequest.description,
            reference: orgRequest.reference,
            createdBy: orgRequest.userId,
            approvedAt: new Date()
        });

        await organization.save();

        const membership = new OrganizationMembership({
            userId: orgRequest.userId,
            organizationId: organization._id,
            role: 'owner',
            permissions: ['read', 'write', 'admin', 'delete']
        });

        await membership.save();

        const user = await User.findById(orgRequest.userId);
        if (user && !user.currentOrganizationId) {
            user.currentOrganizationId = organization._id as any;
            await user.save();
        }

        orgRequest.status = 'approved';
        orgRequest.reviewedAt = new Date();
        orgRequest.rejectionReason = `Aprobada por ${telegramUserName} desde Telegram`;
        await orgRequest.save();

        if (orgRequest.telegramMessageId) {
            const updatedMessage = `✅ <b>APROBADA</b> - ${orgRequest.organizationName}\n\n` +
                `Aprobada por: ${telegramUserName}\n` +
                `Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Bogota' })}\n\n` +
                `La organización ha sido creada exitosamente.`;
            
            await telegramService.updateMessage(
                orgRequest.telegramMessageId,
                updatedMessage
            );
        }

        console.log(`Organization ${orgRequest.organizationName} approved successfully by ${telegramUserName}`);
    } catch (error) {
        console.error('Error approving organization from Telegram:', error);
    }
};

const handleRejectionFromTelegram = async (requestId: string, telegramUserId: string, telegramUserName: string) => {
    try {
        console.log(`Processing rejection for request ${requestId} by ${telegramUserName}`);

        const orgRequest = await OrganizationRequest.findById(requestId);

        if (!orgRequest) {
            console.error(`Organization request ${requestId} not found`);
            return;
        }

        if (orgRequest.status !== 'pending') {
            console.log(`Request ${requestId} has already been reviewed`);
            return;
        }

        orgRequest.status = 'rejected';
        orgRequest.reviewedAt = new Date();
        orgRequest.rejectionReason = `Rechazada por ${telegramUserName} desde Telegram`;
        await orgRequest.save();

        if (orgRequest.telegramMessageId) {
            const updatedMessage = `❌ <b>RECHAZADA</b> - ${orgRequest.organizationName}\n\n` +
                `Rechazada por: ${telegramUserName}\n` +
                `Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Bogota' })}\n\n` +
                `Razón: Rechazada por ${telegramUserName} desde Telegram`;
            
            await telegramService.updateMessage(
                orgRequest.telegramMessageId,
                updatedMessage
            );
        }

        console.log(`Organization request ${orgRequest.organizationName} rejected by ${telegramUserName}`);
    } catch (error) {
        console.error('Error rejecting organization from Telegram:', error);
    }
};