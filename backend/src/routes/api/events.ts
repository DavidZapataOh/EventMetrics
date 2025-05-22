import express from 'express' 
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent, importEventData } from '../../handlers/eventHandler'
import authMiddleware from '../../middleware/authMiddleware'

const router = express.Router()

router.post('/', authMiddleware, createEvent)
router.get('/', authMiddleware, getEvents)
router.get('/:id', authMiddleware, getEventById)
router.put('/:id', authMiddleware, updateEvent)
router.delete('/:id', authMiddleware, deleteEvent)
router.post('/import', authMiddleware, importEventData)

export default router
