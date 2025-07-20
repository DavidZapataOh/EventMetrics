import jwt from 'jsonwebtoken';
import User from '../models/Users';
import { logger } from '../utils/logger'

export const authMiddleware = async (req: any, res: any, next: any) => {
    logger.debug('AuthMiddleware:start', {authorizationHeader: req.header('Authorization')})
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        logger.debug('AuthMiddleware:token extracted', { token })
        
        if (!token) {
            logger.warn('AuthMiddleware:no token provided')
            return res.status(401).json({ message: 'Unauthorized' });
        }
        console.log(process.env.JWT_SECRET as string);
        
        const secret = process.env.JWT_SECRET as string
        logger.debug('AuthMiddleware:JWT_SECRET loaded', { secretLoaded: !!secret })

        const decoded = jwt.verify(token, secret) as { id: string }
        logger.debug('AuthMiddleware:token decoded', { decoded })

        const user = await User.findById(decoded.id).select('-password')
        logger.debug('AuthMiddleware:DB lookup result', { user })

        if (!user) {
            logger.warn('AuthMiddleware:user not found', { userId: decoded.id })
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        logger.info('AuthMiddleware:authorized', { userId: decoded.id })
        next();
    } catch (error) {
        logger.error('AuthMiddleware:error', { err: error })
        res.status(401).json({ message: 'Unauthorized' });
    }
}

export default authMiddleware;