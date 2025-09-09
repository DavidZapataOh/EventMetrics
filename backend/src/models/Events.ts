import mongoose, {Schema} from "mongoose";

interface IEvent {
    name: string
    description: string
    date: Date
    startTime: string 
    endTime: string   
    timezone: string  
    type: string
    location: {       
        address: string
        city: string
        country: string
        coordinates: {
            lat: number
            lng: number
        }
        placeId?: string // Google Places ID
    }
    creator: string
    organizationId: mongoose.Types.ObjectId
    logo: {
        key: string 
        originalName: string 
        size: number 
        uploadedAt: Date
    }
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
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // Formato HH:MM
    },
    endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // Formato HH:MM
    },
    timezone: {
        type: String,
        required: true,
        default: 'America/Bogota'
    },
    type: {
        type: String,
        enum: ['in-person', 'virtual', 'hybrid'],
        required: true
    },
    location: {
        address: {
            type: String,
            required: function(this: any) {
                return this.type === 'in-person' || this.type === 'hybrid';
            }
        },
        city: String,
        country: String,
        coordinates: {
            lat: {
                type: Number,
                required: function(this: any) {
                    return this.type === 'in-person' || this.type === 'hybrid';
                }
            },
            lng: {
                type: Number,
                required: function(this: any) {
                    return this.type === 'in-person' || this.type === 'hybrid';
                }
            }
        },
        placeId: String
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    logo: {
        key: String,
        originalName: String, 
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
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

eventSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    if (this.type === 'virtual') {
        this.location = undefined;
    }
    
    next();
});

const Event = mongoose.model<IEvent>('Event', eventSchema)
export default Event