import mongoose, { Schema, Document } from "mongoose";

interface IOrganizationRequest extends Document {
    organizationName: string;
    logo: {
        key: string;
        originalName: string;
        size: number;
        uploadedAt: Date;
    };
    website: string;
    twitter?: string;
    description: string;
    reference?: string;
    requestedRole: string;
    userId: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    rejectionReason?: string;
    telegramMessageId?: number;
    createdAt: Date;
    updatedAt: Date;
}

const organizationRequestSchema = new Schema({
    organizationName: {
        type: String,
        required: true,
        trim: true
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
    website: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v: string) {
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Website must be a valid URL'
        }
    },
    twitter: {
        type: String,
        trim: true,
        validate: {
            validator: function(v: string) {
                return !v || /^@?[a-zA-Z0-9_]+$/.test(v);
            },
            message: 'Twitter handle must be valid'
        }
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    reference: {
        type: String,
        trim: true
    },
    requestedRole: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    telegramMessageId: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

organizationRequestSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const OrganizationRequest = mongoose.model<IOrganizationRequest>('OrganizationRequest', organizationRequestSchema);
export default OrganizationRequest;