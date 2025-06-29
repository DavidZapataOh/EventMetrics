import Event from '../models/Events'
import csv from 'csv-parser'
import fs from 'fs'
import xlsx from 'xlsx'
import path from 'path'
import mongoose from 'mongoose'
import { getSignedUrl, deleteFromS3 } from '../services/uploadService'

const getEvents = async (req: any, res: any) => {
    try {
        const { page = 1, limit = 10, search, sort = '-createdAt' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Construir query de búsqueda
        let query: any = { creator: req.user._id };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Obtener eventos con paginación
        const events = await Event.find(query)
            .populate('creator', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Agregar URLs firmadas para las imágenes
        const eventsWithSignedUrls = await Promise.all(
            events.map(async (event) => {
                const eventObj = event.toObject() as any;
                if (eventObj.logo && eventObj.logo.key) {
                    eventObj.logoUrl = await getSignedUrl(eventObj.logo.key);
                }
                return eventObj;
            })
        );

        // Contar total de eventos
        const total = await Event.countDocuments(query);
        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            data: {
                data: eventsWithSignedUrls,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching events',
            error: (error as Error).message 
        });
    }
}

const getEventById = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid event ID format' 
            });
        }

        const event = await Event.findById(id).populate('creator', 'name email');
        
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: 'Event not found' 
            });
        }

        // Verificar que el usuario tenga acceso al evento
        if (event.creator._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {            return res.status(403).json({ 
                success: false,
                message: 'Access denied' 
            });
        }

        // Agregar URL firmada para la imagen
        const eventObj = event.toObject() as any;
        if (eventObj.logo && eventObj.logo.key) {
            eventObj.logoUrl = await getSignedUrl(eventObj.logo.key);
        }

        res.status(200).json({
            success: true,
            data: eventObj
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching event',
            error: (error as Error).message 
        });
    }
}

const createEvent = async (req: any, res: any) => {
    try {
        console.log('Raw body received:', req.body);
        console.log('Location received:', req.body.location);
        console.log('Location type:', typeof req.body.location);

        // Procesar arrays y objetos que vienen como strings JSON
        const processedBody = { ...req.body };
        
        // Función helper para procesar arrays
        const processArray = (value: any) => {
            if (Array.isArray(value)) {
                return value;
            }
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    console.error('Error parsing array:', e);
                    return [];
                }
            }
            return [];
        };

        // Función helper para procesar objetos
        const processObject = (value: any) => {
            if (typeof value === 'object' && value !== null) {
                return value;
            }
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    console.error('Error parsing object:', e);
                    return null;
                }
            }
            return null;
        };

        // Procesar arrays específicos
        processedBody.objectives = processArray(processedBody.objectives);
        processedBody.kpis = processArray(processedBody.kpis);
        processedBody.specialGuests = processArray(processedBody.specialGuests);
        processedBody.openedWalletAddresses = processArray(processedBody.openedWalletAddresses);

        // Procesar objetos complejos
        if (processedBody.location) {
            processedBody.location = processObject(processedBody.location);
            console.log('Processed location:', processedBody.location);
        }
        if (processedBody.marketing) {
            processedBody.marketing = processObject(processedBody.marketing);
        }
        if (processedBody.virtualMetrics) {
            processedBody.virtualMetrics = processObject(processedBody.virtualMetrics);
        }
        if (processedBody.registeredAttendees) {
            processedBody.registeredAttendees = processArray(processedBody.registeredAttendees);
        }
        if (processedBody.transactionsDuringEvent) {
            processedBody.transactionsDuringEvent = processArray(processedBody.transactionsDuringEvent);
        }

        console.log('Processed objectives:', processedBody.objectives);
        console.log('Processed kpis:', processedBody.kpis);
        console.log('Final processed location:', processedBody.location);

        const eventData = {
            ...processedBody,
            creator: req.user._id,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Si hay archivo subido, agregar información del logo
        if (req.file) {
            eventData.logo = {
                key: req.file.key,
                originalName: req.file.originalname,
                size: req.file.size,
                uploadedAt: new Date()
            };
        }

        console.log('Final eventData before save:', JSON.stringify(eventData, null, 2));

        const newEvent = new Event(eventData);
        const savedEvent = await newEvent.save();
        
        // Populate creator info
        await savedEvent.populate('creator', 'name email');

        // Agregar URL firmada para la imagen
        const eventObj = savedEvent.toObject() as any;
        if (eventObj.logo && eventObj.logo.key) {
            try {
                eventObj.logoUrl = await getSignedUrl(eventObj.logo.key);
            } catch (error) {
                console.error('Error generating signed URL for new event:', error);
            }
        }

        res.status(201).json({
            success: true,
            data: eventObj,
            message: 'Event created successfully'
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(400).json({ 
            success: false,
            message: 'Error creating event',
            error: (error as Error).message 
        });
    }
}

const updateEvent = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid event ID format' 
            });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: 'Event not found' 
            });
        }
        
        if (event.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied' 
            });
        }

        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };

        // Si hay nuevo archivo subido, eliminar el anterior y agregar el nuevo
        if (req.file) {
            // Eliminar imagen anterior si existe
            if (event.logo && event.logo.key) {
                try {
                    await deleteFromS3(event.logo.key);
                } catch (error) {
                    console.error('Error deleting old image:', error);
                }
            }

            // Agregar nueva imagen
            updateData.logo = {
                key: req.file.key,
                originalName: req.file.originalname,
                size: req.file.size,
                uploadedAt: new Date()
            };
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('creator', 'name email');

        // Agregar URL firmada para la imagen
        const eventObj = updatedEvent!.toObject() as any;
        if (eventObj.logo && eventObj.logo.key) {
            eventObj.logoUrl = await getSignedUrl(eventObj.logo.key);
        }

        res.status(200).json({
            success: true,
            data: eventObj,
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(400).json({ 
            success: false,
            message: 'Error updating event',
            error: (error as Error).message 
        });
    }
}

const deleteEvent = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid event ID format' 
            });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: 'Event not found' 
            });
        }
        
        if (event.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied' 
            });
        }

        // Eliminar imagen de S3 si existe
        if (event.logo && event.logo.key) {
            try {
                await deleteFromS3(event.logo.key);
            } catch (error) {
                console.error('Error deleting image from S3:', error);
            }
        }

        await Event.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting event',
            error: (error as Error).message 
        });
    }
}

const importEventData = async (req: any, res: any) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        const file = req.files.file;
        const { eventId, importType } = req.body; // 'attendees' o 'metrics'

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid event ID format' 
            });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: 'Event not found' 
            });
        }
        
        if (event.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied' 
            });
        }

        const uploadPath = path.join(__dirname, '..', 'uploads', `${Date.now()}-${file.name}`);
        await file.mv(uploadPath);

        let data: any[] = [];

        try {
            if (file.name.endsWith('.csv')) {
                data = await processCsvFile(uploadPath) as any[];
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                data = await processExcelFile(uploadPath) as any[];
            } else {
                return res.status(400).json({ 
                    success: false,
                    message: 'Unsupported file format. Please use CSV or Excel files.' 
                });
            }

            if (data.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No data found in the file' 
                });
            }

            // Procesar según el tipo de importación
            let processedData;
            if (importType === 'attendees') {
                processedData = processAttendeesData(data);
            } else if (importType === 'metrics') {
                processedData = processMetricsData(data);
            } else {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid import type. Use "attendees" or "metrics".' 
                });
            }
            
            const updatedEvent = await Event.findByIdAndUpdate(
                eventId,
                {
                    ...processedData,
                    updatedAt: new Date()
                },
                { new: true }
            ).populate('creator', 'name email');

            res.status(200).json({ 
                success: true,
                data: updatedEvent,
                message: `${importType === 'attendees' ? 'Attendees' : 'Event metrics'} imported successfully. ${data.length} records processed.` 
            });
        } finally {
            if (fs.existsSync(uploadPath)) {
                fs.unlinkSync(uploadPath);
            }
        }
    } catch (error) {
        console.error('Error importing event data:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error importing event data',
            error: (error as Error).message 
        });
    }
}

const processAttendeesData = (data: any[]) => {
    const registeredAttendees = data
        .filter(row => row.name && row.email)
        .map(row => ({
            name: row.name.trim(),
            email: row.email.trim(),
            walletAddress: row.walletAddress?.trim() || ''
        }));
    
    return { registeredAttendees };
}

const processMetricsData = (data: any[]) => {
    const processedData: any = {};
    
    // Tomar la primera fila con datos (debería ser la única)
    const metricsRow = data[0];
    
    if (!metricsRow) return processedData;
    
    // Procesar métricas numéricas
    const numericFields = [
        'confirmedAttendees', 'totalAttendees', 'attendeesWithCertificate',
        'previosEventAttendees', 'newWallets', 'transactionsAfterEvent',
        'totalCost', 'budgetSurplusDeficit'
    ];
    
    numericFields.forEach(field => {
        if (metricsRow[field] !== undefined && metricsRow[field] !== '') {
            processedData[field] = parseFloat(metricsRow[field]) || 0;
        }
    });
    
    // Métricas virtuales
    if (metricsRow.virtualEngagement || metricsRow.virtualConnectionTime) {
        processedData.virtualMetrics = {};
        if (metricsRow.virtualEngagement) {
            processedData.virtualMetrics.engagement = parseFloat(metricsRow.virtualEngagement) || 0;
        }
        if (metricsRow.virtualConnectionTime) {
            processedData.virtualMetrics.connectionTime = parseFloat(metricsRow.virtualConnectionTime) || 0;
        }
    }
    
    // Marketing
    if (metricsRow.marketingChannels || metricsRow.marketingCampaign) {
        processedData.marketing = {};
        if (metricsRow.marketingChannels) {
            processedData.marketing.channels = metricsRow.marketingChannels
                .split(';')
                .map((channel: string) => channel.trim())
                .filter((channel: string) => channel.length > 0);
        }
        if (metricsRow.marketingCampaign) {
            processedData.marketing.campaign = metricsRow.marketingCampaign.trim();
        }
    }
    
    // Arrays separados por punto y coma
    if (metricsRow.specialGuests) {
        processedData.specialGuests = metricsRow.specialGuests
            .split(';')
            .map((guest: string) => guest.trim())
            .filter((guest: string) => guest.length > 0);
    }
    
    if (metricsRow.openedWalletAddresses) {
        processedData.openedWalletAddresses = metricsRow.openedWalletAddresses
            .split(';')
            .map((address: string) => address.trim())
            .filter((address: string) => address.length > 0);
    }
    
    return processedData;
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
        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet);
            resolve(json);
        } catch (error) {
            reject(error);
        }
    })
}

export { getEvents, getEventById, createEvent, updateEvent, deleteEvent, importEventData, processCsvFile, processExcelFile };