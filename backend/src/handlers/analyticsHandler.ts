import Event from '../models/Events';

const getOverallMetrics = async (req: any, res: any) => {
    try {
        const totalEvents = await Event.countDocuments();

        const eventByType = await Event.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);

        const totalAttendees = await Event.aggregate([
            { $group: { _id: null, total: { $sum: "$confirmedAttendees" } } },
        ]);

        const totalNewWallets = await Event.aggregate([
            { $group: { _id: null, total: { $sum: "$newWallets" } } },
        ]);

        const totalCosts = await Event.aggregate([
            { $group: { _id: null, total: { $sum: "$totalCost" } } },
        ]);
        
        res.json({
            totalEvents,
            eventByType,
            totalAttendees: totalAttendees[0]?.total || 0,
            totalNewWallets: totalNewWallets[0]?.total || 0,
            totalCosts: totalCosts[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching overall metrics' });
    }
}

const getUserMetrics = async (req: any, res: any) => {
    try {
        const userMetrics = await Event.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
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

        res.json(userMetrics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user metrics' });
    }
}

const getTimelineMetrics = async (req: any, res: any) => {
    try {
        const { startDate, endDate } = req.query;

        const query = {} as any;

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const events = await Event.find(query)
            .sort({ date: 1 })
            .select('date totalCost confirmedAttendees newWallets');

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching timeline metrics' });
    }
}

const getRegionMetrics = async (req: any, res: any) => {
    try {
        const regionMetrics = await Event.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
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

        res.json(regionMetrics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching region metrics' });
    }
}

const getWalletMetrics = async (req: any, res: any) => {
    try {
        const totalNewWallets = await Event.aggregate([
            { $group: { _id: null, total: { $sum: "$newWallets" } } },
        ]);

        const transactionsDuringEvents = await Event.aggregate([
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

        res.json({
            totalNewWallets: totalNewWallets[0]?.total || 0,
            transactionsByType: transactionsDuringEvents,
            costPerWallet: costPerWallet[0]?.costPerWallet || 0,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wallet metrics' });
    }
}

export { getOverallMetrics, getUserMetrics, getTimelineMetrics, getRegionMetrics, getWalletMetrics };