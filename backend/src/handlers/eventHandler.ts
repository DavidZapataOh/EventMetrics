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
        if (event.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ 
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
        console.log('Import request received:', {
            hasFiles: !!req.files,
            body: req.body,
            fileNames: req.files ? Object.keys(req.files) : 'none'
        });

        if (!req.files || !req.files.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        const file = req.files.file;
        const { eventId, importType } = req.body;

        console.log('Processing file:', {
            name: file.name,
            size: file.size,
            eventId,
            importType
        });

        if (!eventId) {
            return res.status(400).json({ 
                success: false,
                message: 'Event ID is required' 
            });
        }

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
                data = await processLumaCsvFile(uploadPath) as any[];
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                data = await processExcelFile(uploadPath) as any[];
            } else {
                return res.status(400).json({ 
                    success: false,
                    message: 'Unsupported file format. Please use CSV or Excel files.' 
                });
            }

            console.log(`Parsed ${data.length} rows from file`);

            if (data.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No data found in the file or all rows were invalid' 
                });
            }

            // Procesar según el tipo de importación
            let processedData;
            if (importType === 'attendees' || !importType) { // Default a attendees
                processedData = processLumaAttendeesData(data);
            } else if (importType === 'metrics') {
                processedData = processMetricsData(data);
            } else {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid import type. Use "attendees" or "metrics".' 
                });
            }

            if (!processedData.registeredAttendees || processedData.registeredAttendees.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No valid attendees found in the file. Please check that the file has "name" and "email" columns with valid data.' 
                });
            }

            console.log(`Processed ${processedData.registeredAttendees.length} valid attendees`);
            
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
                message: `Successfully imported ${processedData.registeredAttendees.length} attendees` 
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
    console.log('Processing attendees data, sample row:', data[0]);
    console.log('Available columns:', Object.keys(data[0] || {}));
    
    const registeredAttendees = data
        .filter(row => {
            // Verificar que tenga email y al menos un nombre
            const hasEmail = row.email && row.email.trim();
            const hasName = (row.name && row.name.trim()) || 
                           (row.first_name && row.first_name.trim()) || 
                           (row.last_name && row.last_name.trim());
            return hasEmail && hasName;
        })
        .map(row => {
            // Construir el nombre completo
            let fullName = '';
            
            if (row.name && row.name.trim()) {
                // Si ya tiene nombre completo, usarlo
                fullName = row.name.trim();
            } else {
                // Construir desde first_name y last_name
                const firstName = row.first_name ? row.first_name.trim() : '';
                const lastName = row.last_name ? row.last_name.trim() : '';
                fullName = `${firstName} ${lastName}`.trim();
            }
            
            const attendee = {
                name: fullName,
            email: row.email.trim(),
                walletAddress: '', // lu.ma no incluye wallet por defecto
                registrationDate: row.created_at || new Date().toISOString(),
                approvalStatus: row.approval_status || 'approved',
                checkedIn: !!row.checked_in_at,
                ticketType: row.ticket_name || 'General',
                source: 'luma',
                // Campos adicionales de lu.ma que podrían ser útiles
                lumaData: {
                    apiId: row.api_id,
                    phone: row.phone_number || '',
                    city: row["¿En qué ciudad estás viviendo? "] || '',
                    twitter: row["¿Cuál es tu nombre de usuario en X (Twitter)?"] || '',
                    web3Interest: row["¿Cuál es tu mayor interés en Web3?"] || '',
                    isProgrammer: row["¿Eres programador?"] || '',
                    university: row["¿Estás relacionado con alguna universidad?"] || '',
                    dietaryRestrictions: row["¿Tienes alguna restricción alimentaria?"] || ''
                }
            };
            
            console.log('Processed attendee:', attendee.name, attendee.email);
            return attendee;
        });
    
    console.log(`Successfully processed ${registeredAttendees.length} attendees from ${data.length} rows`);
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
        
// Reemplazar la función processLumaCsvFile con esta versión más robusta:

const processLumaCsvFile = (filePath: string) => {
    return new Promise((resolve, reject) => {
        try {
            console.log(`🔍 Processing CSV file with manual parser: ${filePath}`);
            
            // Leer el archivo completo como string
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const lines = fileContent.split('\n');
            
            console.log(`📄 File has ${lines.length} lines`);
            console.log(`📋 First line (headers): ${lines[0].substring(0, 200)}...`);
            
            if (lines.length < 2) {
                console.log('❌ File has no data rows');
                resolve([]);
                return;
            }
            
            // Parsear headers manualmente
            const headerLine = lines[0];
            const headers = parseCSVLine(headerLine);
            
            console.log(`📊 Found ${headers.length} headers:`, headers.slice(0, 10));
            
            // Buscar los índices de las columnas que necesitamos
            const emailIndex = findColumnIndex(headers, ['email']);
            const nameIndex = findColumnIndex(headers, ['name']);
            const firstNameIndex = findColumnIndex(headers, ['first_name']);
            const lastNameIndex = findColumnIndex(headers, ['last_name']);
            const apiIdIndex = findColumnIndex(headers, ['api_id']);
            const createdAtIndex = findColumnIndex(headers, ['created_at']);
            const approvalStatusIndex = findColumnIndex(headers, ['approval_status']);
            const checkedInIndex = findColumnIndex(headers, ['checked_in_at']);
            const ticketNameIndex = findColumnIndex(headers, ['ticket_name']);
            
            console.log(`🔍 Column indices found:`, {
                email: emailIndex,
                name: nameIndex,
                firstName: firstNameIndex,
                lastName: lastNameIndex,
                apiId: apiIdIndex
            });
            
            if (emailIndex === -1) {
                console.log('❌ Email column not found in headers');
                resolve([]);
                return;
            }
            
            const results = [];
            
            // Procesar cada línea de datos (saltando la cabecera)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Saltar líneas vacías
                
                try {
                    const values = parseCSVLine(line);
                    
                    if (values.length < headers.length - 5) { // Permitir algunas columnas faltantes
                        console.log(`⚠️ Row ${i} has too few columns, skipping`);
                        continue;
                    }
                    
                    const email = values[emailIndex]?.trim();
                    const name = values[nameIndex]?.trim() || '';
                    const firstName = values[firstNameIndex]?.trim() || '';
                    const lastName = values[lastNameIndex]?.trim() || '';
                    
                    // Validar que tenga email y al menos un nombre
                    if (!email || !email.includes('@')) {
                        if (i <= 5) console.log(`❌ Row ${i}: Invalid email: "${email}"`);
                        continue;
                    }
                    
                    if (!name && !firstName && !lastName) {
                        if (i <= 5) console.log(`❌ Row ${i}: No name found`);
                        continue;
                    }
                    
                    // Construir objeto de datos
                    const rowData = {
                        api_id: values[apiIdIndex]?.trim() || '',
                        email: email,
                        name: name,
                        first_name: firstName,
                        last_name: lastName,
                        created_at: values[createdAtIndex]?.trim() || '',
                        approval_status: values[approvalStatusIndex]?.trim() || 'approved',
                        checked_in_at: values[checkedInIndex]?.trim() || '',
                        ticket_name: values[ticketNameIndex]?.trim() || 'Standard'
                    };
                    
                    results.push(rowData);
                    
                    if (i <= 3) {
                        console.log(`✅ Row ${i} processed:`, {
                            email: rowData.email,
                            name: rowData.name,
                            firstName: rowData.first_name,
                            lastName: rowData.last_name
                        });
                    }
                    
                } catch (error) {
                    console.warn(`⚠️ Error processing row ${i}:`, (error as Error).message);
                }
            }
            
            console.log(`✅ Manual CSV processing complete: ${results.length} valid rows from ${lines.length - 1} data rows`);
            resolve(results);
            
        } catch (error) {
            console.error('❌ Error in manual CSV processing:', error);
            reject(error);
        }
    });
};

// Función helper para parsear una línea CSV manualmente
function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i += 2;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    
    // Add the last field
    result.push(current);
    
    return result;
}

// Función helper para encontrar índice de columna
function findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
        const index = headers.findIndex(h => 
            h.toLowerCase().trim() === name.toLowerCase() ||
            h.toLowerCase().trim().includes(name.toLowerCase())
        );
        if (index !== -1) return index;
    }
    return -1;
}

// Actualizar processLumaAttendeesData para ser aún más robusto:

const processLumaAttendeesData = (data: any[]) => {
    console.log('🔄 Processing lu.ma attendees data');
    console.log(`📊 Input: ${data.length} rows`);
    
    if (data.length > 0) {
        console.log('📋 Sample row structure:', {
            email: data[0].email,
            name: data[0].name,
            first_name: data[0].first_name,
            last_name: data[0].last_name,
            api_id: data[0].api_id
        });
    }
    
    const registeredAttendees = data
        .filter((row, index) => {
            // Verificar email válido
            const hasValidEmail = row.email && 
                                typeof row.email === 'string' && 
                                row.email.trim().length > 0 &&
                                row.email.includes('@') &&
                                row.email.includes('.');
            
            if (!hasValidEmail) {
                if (index < 3) console.log(`❌ Row ${index + 1}: Invalid email:`, row.email);
                return false;
            }
            
            // Verificar nombre
            const hasName = (row.name && row.name.trim()) || 
                           (row.first_name && row.first_name.trim()) || 
                           (row.last_name && row.last_name.trim());
            
            if (!hasName) {
                if (index < 3) console.log(`❌ Row ${index + 1}: No name:`, { 
                    name: row.name, 
                    first_name: row.first_name, 
                    last_name: row.last_name 
                });
                return false;
            }
            
            if (index < 3) console.log(`✅ Row ${index + 1}: Valid attendee`);
            return true;
        })
        .map((row, index) => {
            // Construir nombre completo
            let fullName = '';
            
            if (row.name && row.name.trim()) {
                fullName = row.name.trim();
            } else {
                const firstName = row.first_name ? row.first_name.trim() : '';
                const lastName = row.last_name ? row.last_name.trim() : '';
                
                if (firstName && lastName) {
                    fullName = `${firstName} ${lastName}`;
                } else {
                    fullName = firstName || lastName || 'Unknown';
                }
            }
            
            const attendee = {
                name: fullName,
                email: row.email.trim().toLowerCase(),
                walletAddress: '',
                registrationDate: row.created_at || new Date().toISOString(),
                approvalStatus: row.approval_status || 'approved',
                checkedIn: !!row.checked_in_at,
                ticketType: row.ticket_name || 'Standard',
                source: 'luma',
                lumaId: row.api_id || ''
            };
            
            if (index < 3) {
                console.log(`✅ Created attendee ${index + 1}:`, {
                    name: attendee.name,
                    email: attendee.email,
                    source: attendee.source
                });
            }
            
            return attendee;
        });
    
    console.log(`📈 Final result: ${registeredAttendees.length} valid attendees processed`);
    
    return { registeredAttendees };
};

const processExcelFile = (filePath: string) => {
    return new Promise((resolve, reject) => {
        try {
            console.log(`🔍 Processing Excel file: ${filePath}`);
            
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (data.length < 2) {
                console.log('❌ Excel file has no data rows');
                resolve([]);
                return;
            }
            
            // Convertir a formato de objetos usando la primera fila como headers
            const headers = data[0] as string[];
            const results = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i] as any[];
                const rowData: any = {};
                
                headers.forEach((header, index) => {
                    rowData[header] = row[index] || '';
                });
                
                results.push(rowData);
            }
            
            console.log(`✅ Excel processing complete: ${results.length} rows`);
            resolve(results);
            
        } catch (error) {
            console.error('❌ Error processing Excel file:', error);
            reject(error);
        }
    });
};

export { getEvents, getEventById, createEvent, updateEvent, deleteEvent, importEventData, processLumaCsvFile, processLumaAttendeesData, processExcelFile };