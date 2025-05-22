import express from 'express'
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../../handlers/userHandler'     
import authMiddleware from '../../middleware/authMiddleware'
import { registerValidator, validators } from '../../middleware/validators'


const router = express.Router()

router.get('/', authMiddleware, getUsers)
router.get('/:id', authMiddleware, getUserById)
router.post('/', [authMiddleware, ...registerValidator, validators], createUser)
router.put('/:id', authMiddleware, updateUser)
router.delete('/:id', authMiddleware, deleteUser)

export default router