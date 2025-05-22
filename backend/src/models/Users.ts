import mongoose, {Schema} from "mongoose";

interface IUser {
    handle: string
    name: string
    email: string
    password: string
    role: string
    region: string
    profilePicture: string
    createdAt: Date
    updatedAt: Date
}

const userSchema = new Schema({
    handle: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    profilePicture: {
        type: String,
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

const User = mongoose.model<IUser>('User', userSchema)
export default User