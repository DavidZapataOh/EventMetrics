import jwt from 'jsonwebtoken';
import User from '../models/Users';

export const authMiddleware = async (req: any, res: any, next: any) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decodedToken.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

export default authMiddleware;