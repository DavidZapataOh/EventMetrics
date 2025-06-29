import Event from '../models/Events';

const getOverallMetrics = async (req: any, res: any) => {
    try {
        // Filtrar eventos por el usuario autenticado
        const userFilter = { creator: req.user._id };

        const totalEvents = await Event.countDocuments(userFilter);

        const eventByType = await Event.aggregate([
            { $match: userFilter },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);

        const totalAttendees = await Event.aggregate([
            { $match: userFilter },
            { $group: { _id: null, total: { $sum: "$confirmedAttendees" } } },
        ]);

        const totalNewWallets = await Event.aggregate([
            { $match: userFilter },
            { $group: { _id: null, total: { $sum: "$newWallets" } } },
        ]);

        const totalCosts = await Event.aggregate([
            { $match: userFilter },
            { $group: { _id: null, total: { $sum: "$totalCost" } } },
        ]);
        
        // Devolver en el formato esperado por el frontend
        res.status(200).json({
            success: true,
            data: {
                totalEvents,
                eventByType,
                totalAttendees: totalAttendees[0]?.total || 0,
                totalNewWallets: totalNewWallets[0]?.total || 0,
                totalCosts: totalCosts[0]?.total || 0,
            }
        });
    } catch (error) {
        console.error('Error fetching overall metrics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching overall metrics',
            error: (error as Error).message 
        });
    }
}

const getUserMetrics = async (req: any, res: any) => {
    try {
        // Solo métricas del usuario autenticado
        const userFilter = { creator: req.user._id };

        const userMetrics = await Event.aggregate([
            { $match: userFilter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'creator',
                    foreignField: '_id',
                    as: 'creatorInfo',
                },
            },
            { $unwind: '$creatorInfo' },
            {
                $group: {
                    _id: '$creator',
                    userName: { $first: '$creatorInfo.name' },
                    eventCount: { $sum: 1 },
                    totalAttendees: { $sum: '$confirmedAttendees' },
                    totalNewWallets: { $sum: '$newWallets' },
                    totalCost: { $sum: '$totalCost' },
                    efficiency: { 
                        $avg: {
                            $cond: [
                                { $gt: ['$totalCost', 0] },
                                { $divide: ['$totalNewWallets', '$totalCost'] },
                                0
                            ]
                        }    
                    },
                }
            },
            { $sort: { totalAttendees: -1 } },
        ]);

        res.status(200).json({
            success: true,
            data: userMetrics
        });
    } catch (error) {
        console.error('Error fetching user metrics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching user metrics',
            error: (error as Error).message 
        });
    }
}

const getTimelineMetrics = async (req: any, res: any) => {
    try {
        const { startDate, endDate } = req.query;
        const userFilter = { creator: req.user._id } as any;

        if (startDate && endDate) {
            userFilter.date = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string),
            };
        }

        const events = await Event.find(userFilter)
            .sort({ date: 1 })
            .select('date totalCost confirmedAttendees newWallets');

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error fetching timeline metrics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching timeline metrics',
            error: (error as Error).message 
        });
    }
}

const getRegionMetrics = async (req: any, res: any) => {
    try {
        // Para métricas de región, podemos mostrar datos del usuario actual
        const userFilter = { creator: req.user._id };

        const regionMetrics = await Event.aggregate([
            { $match: userFilter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'creator',
                    foreignField: '_id',
                    as: 'creatorInfo',
                },
            },
            { $unwind: '$creatorInfo' },
            {
                $group: {
                    _id: '$creatorInfo.region',
                    region: { $first: '$creatorInfo.region' },
                    eventCount: { $sum: 1 },
                    totalAttendees: { $sum: '$confirmedAttendees' },
                    totalNewWallets: { $sum: '$newWallets' },
                    totalCost: { $sum: '$totalCost' },
                }
            },
            { $sort: { totalAttendees: -1 } },
        ]);

        res.status(200).json({
            success: true,
            data: regionMetrics
        });
    } catch (error) {
        console.error('Error fetching region metrics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching region metrics',
            error: (error as Error).message 
        });
    }
}

const getWalletMetrics = async (req: any, res: any) => {
    try {
        const userFilter = { creator: req.user._id };

        const totalNewWallets = await Event.aggregate([
            { $match: userFilter },
            { $group: { _id: null, total: { $sum: "$newWallets" } } },
        ]);

        const transactionsDuringEvents = await Event.aggregate([
            { $match: userFilter },
            { $unwind: '$transactionsDuringEvent' },
            { $group: {
                _id: '$transactionsDuringEvent.type',
                wallet: { $first: '$transactionsDuringEvent.type' },
                totalCount: { $sum: '$transactionsDuringEvent.count' },
            } },
            { $sort: { totalCount: -1 } },
        ]);

        const costPerWallet = await Event.aggregate([
            {
                $match: {
                    ...userFilter,
                    newWallets: { $gt: 0 },
                    totalCost: { $gt: 0 },
                },
            },
            {
                $project: {
                    name: 1,
                    date: 1,
                    costPerWallet: { $divide: ['$totalCost', '$newWallets'] },
                }
            },
            { $sort: { costPerWallet: 1 } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalNewWallets: totalNewWallets[0]?.total || 0,
                transactionsByType: transactionsDuringEvents,
                costPerWallet: costPerWallet[0]?.costPerWallet || 0,
            }
        });
    } catch (error) {
        console.error('Error fetching wallet metrics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching wallet metrics',
            error: (error as Error).message 
        });
    }
}

export { getOverallMetrics, getUserMetrics, getTimelineMetrics, getRegionMetrics, getWalletMetrics };