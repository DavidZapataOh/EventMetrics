import mongoose, { Schema, Document } from "mongoose";

interface IOrganizationMembership extends Document {
    userId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'member';
    status: 'active' | 'inactive' | 'pending';
    permissions: string[];
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const organizationMembershipSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    },
    permissions: {
        type: [String],
        default: ['read']
    },
    joinedAt: {
        type: Date,
        default: Date.now
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

organizationMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

organizationMembershipSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const OrganizationMembership = mongoose.model<IOrganizationMembership>('OrganizationMembership', organizationMembershipSchema);
export default OrganizationMembership;