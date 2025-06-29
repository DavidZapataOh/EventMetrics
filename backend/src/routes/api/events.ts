import express from 'express' 
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../../handlers/eventHandler'
import authMiddleware from '../../middleware/authMiddleware'
import { uploadToS3 } from '../../services/uploadService'

const router = express.Router()

// Rutas con upload de imagen (usando multer)
router.post('/', authMiddleware, uploadToS3.single('logo'), createEvent)
router.put('/:id', authMiddleware, uploadToS3.single('logo'), updateEvent)

// Rutas sin upload
router.get('/', authMiddleware, getEvents)
router.get('/:id', authMiddleware, getEventById)
router.delete('/:id', authMiddleware, deleteEvent)

// Nota: importEventData se movió a una ruta separada

export default router