import mongoose, {Schema} from "mongoose";

interface IEvent {
    name: string
    description: string
    date: Date
    startTime: string // Nueva: hora de inicio (HH:MM)
    endTime: string   // Nueva: hora de fin (HH:MM)
    timezone: string  // Nueva: zona horaria
    type: string
    location: {       // Nueva: información de ubicación
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
    logo: {
        key: string // Clave del archivo en S3
        originalName: string // Nombre original del archivo
        size: number // Tamaño en bytes
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
            required: function() {
                return this.type === 'in-person' || this.type === 'hybrid';
            }
        },
        city: String,
        country: String,
        coordinates: {
            lat: {
                type: Number,
                required: function() {
                    return this.type === 'in-person' || this.type === 'hybrid';
                }
            },
            lng: {
                type: Number,
                required: function() {
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
    logo: {
        key: String, // Clave del archivo en S3
        originalName: String, // Nombre original
        size: Number, // Tamaño en bytes
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

// Middleware para validar ubicación según el tipo
eventSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Si es evento virtual, remover ubicación
    if (this.type === 'virtual') {
        this.location = undefined;
    }
    
    next();
});

const Event = mongoose.model<IEvent>('Event', eventSchema)
export default Event