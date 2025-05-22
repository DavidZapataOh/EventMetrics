import { check, validationResult } from 'express-validator';

const validators = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

const registerValidator = [
    check('name').notEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

const loginValidator = [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').exists().withMessage('Password is required'),
];

const eventValidator = [
    check('title').notEmpty().withMessage('Title is required'),
    check('description').notEmpty().withMessage('Description is required'),
    check('date').isDate().withMessage('Invalid date'),
    check('type').isIn(['in-person', 'virtual', 'hybrid']).withMessage('Invalid event type'),
    check('objectives').isArray().withMessage('Objectives must be an array'),
];


export { validators, registerValidator, loginValidator, eventValidator };