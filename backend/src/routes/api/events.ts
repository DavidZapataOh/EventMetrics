import express from 'express' 
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../../handlers/eventHandler'
import authMiddleware from '../../middleware/authMiddleware'
import { uploadToS3 } from '../../services/uploadService'
import organizationMiddleware from '../../middleware/organizationMiddleware'

const router = express.Router()

router.post('/', [authMiddleware, organizationMiddleware], uploadToS3.single('logo'), createEvent)
router.put('/:id', [authMiddleware, organizationMiddleware], uploadToS3.single('logo'), updateEvent)

router.get('/', [authMiddleware, organizationMiddleware], getEvents)
router.get('/:id', [authMiddleware, organizationMiddleware], getEventById)
router.delete('/:id', [authMiddleware, organizationMiddleware], deleteEvent)

export default router