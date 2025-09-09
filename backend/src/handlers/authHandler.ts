import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/Users';
import { CursorTimeoutMode } from 'mongodb';

const register = async (req: any, res: any) => {
    try {
        const { name, email, password, role, handle, region } = req.body;
        
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let existingHandle = await User.findOne({ handle });
        if (existingHandle) {
            return res.status(400).json({ message: 'Handle already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ handle, name, email, password: hashedPassword, role: role || 'user', region });
        await user.save();

        const payload = {
            id: user._id,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: user._id, handle: user.handle, name: user.name, email: user.email, role: user.role, region: user.region, currentOrganizationId: user.currentOrganizationId }, organizations: [] });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
}

const login = async (req: any, res: any) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const payload = {
            id: user._id,   
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '24h' });
        const OrganizationMembership = require('../models/OrganizationMembership').default;
        const Organization = require('../models/Organization').default;
        
        const memberships = await OrganizationMembership.find({ 
            userId: user._id, 
            status: 'active' 
        }).populate('organizationId', 'name logo');
        
        const organizations = memberships.map((membership: any) => ({
            ...membership.organizationId.toObject(),
            membership: {
                role: membership.role,
                permissions: membership.permissions
            }
        }));
        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, currentOrganizationId: user.currentOrganizationId }, organizations });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
}

const getCurrentUser = async (req: any, res: any) => {
    try {
        const user = req.user;
        const OrganizationMembership = require('../models/OrganizationMembership').default;
        const Organization = require('../models/Organization').default;
        
        const memberships = await OrganizationMembership.find({ 
            userId: user._id, 
            status: 'active' 
        }).populate('organizationId', 'name logo website');
        
        const organizations = memberships.map((membership: any) => ({
            ...membership.organizationId.toObject(),
            membership: {
                role: membership.role,
                permissions: membership.permissions
            }
        }));
        
        let currentOrganization = null;
        if (user.currentOrganizationId) {
            const currentMembership = memberships.find((m: any) => 
                m.organizationId._id.toString() === user.currentOrganizationId.toString()
            );
            currentOrganization = currentMembership || null;
        }
        
        res.json({
            ...user.toObject(),
            password: undefined,
            organizations,
            currentOrganization
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ message: 'Error getting user information' });
    }
};

export { register, login, getCurrentUser };