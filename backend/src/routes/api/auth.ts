import express from 'express'
import { register, login, getCurrentUser } from '../../handlers/authHandler'
import authMiddleware from '../../middleware/authMiddleware'
import { registerValidator, loginValidator, validators } from '../../middleware/validators'

const router = express.Router()

router.post('/register', [...registerValidator, validators], register)
router.post('/login', [...loginValidator, validators], login)
router.get('/me', authMiddleware, getCurrentUser)

export default router