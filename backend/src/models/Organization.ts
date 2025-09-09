import mongoose, { Schema, Document } from "mongoose";

interface IOrganization extends Document {
    name: string;
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
    status: 'active' | 'inactive';
    createdBy: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const organizationSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
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
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
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

organizationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
export default Organization;