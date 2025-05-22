import mongoose, {Schema} from "mongoose";

interface IEvent {
    name: string
    description: string
    date: Date
    type: string
    creator: string
    logo: string
    objectives: string[]
    kpis: string[]
    registeredAttendees: {
        name: string
        email: string
        walletAddress: string
    }[]
    specialGuests: string[]
    confirmedAttendees: number
    totalAttendees: number
    attendeesWithCertificate: number
    previosEventAttendees: number
    newWallets: number
    openedWalletAddresses: string[]
    transactionsDuringEvent: {
        type: string
        count: number
        details: string
    }[]
    transactionsAfterEvent: number
    totalCost: number
    budgetSurplusDeficit: number
    marketing: {
        channels: string[]
        campaign: string
    }
    virtualMetrics: {
        engagement: number
        connectionTime: number
        other: mongoose.Schema.Types.Mixed
    }
    createdAt: Date
    updatedAt: Date
}

const eventSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['in-person', 'virtual', 'hybrid'],
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    logo: {
        type: String,
    },
    objectives: {
        type: [String],
    },
    kpis: {
        type: [String],
    },
    registeredAttendees: [{
        name: String,
        email: String,
        walletAddress: String,
    }],
    specialGuests: [String],
    confirmedAttendees: Number,
    totalAttendees: Number,
    attendeesWithCertificate: Number,
    previosEventAttendees: Number,
    newWallets: Number,
    openedWalletAddresses: [String],
    transactionsDuringEvent: [{
        type: String,
        count: Number,
        details: String,
    }],
    transactionsAfterEvent: Number,
    totalCost: Number,
    budgetSurplusDeficit: Number,
    marketing: {
        channels: [String],
        campaign: String,
    },
    virtualMetrics: {
        engagement: Number,
        connectionTime: Number,
        other: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

const Event = mongoose.model<IEvent>('Event', eventSchema)
export default Event