import Event from '../models/Events'
import csv from 'csv-parser'
import fs from 'fs'
import xlsx from 'xlsx'
import path from 'path'

const getEvents = async (req: any, res: any) => {
    try {
        const events = await Event.find().populate('creator', 'name');
        res.status(200).json(events)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events' })
    }
}

const getEventById = async (req: any, res: any) => {
    try {
        const event = await Event.findById(req.params.id).populate('creator', 'name');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }
        res.status(200).json(event)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event' })
    }
}

const createEvent = async (req: any, res: any) => {
    try {
        const newEvent = new Event({
            ...req.body,
            creator: req.user._id
        })
        const savedEvent = await newEvent.save()
        res.status(201).json(savedEvent)
    } catch (error) {
        res.status(500).json({ message: 'Error creating event' })
    }
}

const updateEvent = async (req: any, res: any) => {
    try {
        const event = await Event.findById(req.params.id)
        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }
        
        if (event.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' })
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedAt: new Date()
            },
            { new: true }
        )
        res.status(200).json(updatedEvent)
    } catch (error) {
        res.status(400).json({ message: 'Error updating event' })
    }
}

const deleteEvent = async (req: any, res: any) => {
    try {
        const event = await Event.findById(req.params.id)
        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }

        if (event.creator.toString() !== req.user._id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' })
        }

        await Event.findByIdAndDelete(req.params.id)
        res.status(200).json({ message: 'Event deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event' })
    }
}

const importEventData = async (req: any, res: any) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: 'No file uploaded' })
        }

        const file = req.files.file;
        const eventId = req.body.eventId;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }
        if (event.creator.toString() !== req.user._id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' })
        }

        const uploadPath = path.join(__dirname, '..', 'uploads', file.name);
        await file.mv(uploadPath);

        let data: any[] = [];

        if (file.name.endsWith('.csv')) {
            data = await processCsvFile(uploadPath) as any[];
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            data = await processExcelFile(uploadPath) as any[];
        }

        if (data.length === 0) {
            return res.status(400).json({ message: 'No data found in the file' })
        }
        
        fs.unlinkSync(uploadPath);

        res.status(200).json({ message: 'Event data imported successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error importing event data' })
    }
}
        
const processCsvFile = (filePath: string) => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err))
    })
}

const processExcelFile = (filePath: string) => {
    return new Promise((resolve, reject) => {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(sheet);
        resolve(json);
    })
}

export { getEvents, getEventById, createEvent, updateEvent, deleteEvent, importEventData, processCsvFile, processExcelFile };