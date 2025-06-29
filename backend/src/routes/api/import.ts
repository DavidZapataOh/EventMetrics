import express from 'express'
import { importEventData } from '../../handlers/eventHandler'
import authMiddleware from '../../middleware/authMiddleware'
import fileUpload from 'express-fileupload'

const router = express.Router()

// Middleware específico para esta ruta
router.use(fileUpload({
    createParentPath: true
}))

router.post('/events', authMiddleware, importEventData)

export default router 