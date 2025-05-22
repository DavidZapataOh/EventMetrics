import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
});

const configureSecurityMiddleware = (app: any) => {
    //app.use(helmet());
    //app.use('/api/', limiter);
    //app.use(mongoSanitize());
    //app.use(xss());
};

export default configureSecurityMiddleware;
