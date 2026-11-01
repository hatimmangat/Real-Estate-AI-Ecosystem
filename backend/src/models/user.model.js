import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return !/^\d/.test(v);
                },
                message: 'Name cannot start with a digit'
            }
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        supabaseUid: {
            type: String,
            required: true,
            unique: true
        },
        phoneNumber: {
            type: String,
        },
        profilePicture: {
            type: String,
            required: [true, 'Profile picture is required']
        },
        role: {
            type: String,
            enum: ['user', 'agent', 'admin', 'architect', 'designer', 'developer', 'contractor', 'project-manager', 'legal', 'plumber', 'electrician', 'painter', 'tiles-master', 'carpenter', 'other'],
            default: 'user'
        },
        resume: {
            type: String,
            default: null
        },
        specialization: {
            type: String,
            default: null
        },
        city: {
            type: String,
            default: null
        },
        website: {
            type: String,
            default: null
        },
        address: {
            type: String,
            default: null
        },
        about: {
            type: String,
            default: null
        },
        mobile: {
            type: String,
            default: null
        },
        landline: {
            type: String,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema);

export default User;
