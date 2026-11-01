import mongoose from 'mongoose';

const adminRegistrationSchema = new mongoose.Schema(
    {
        trackingNumber: {
            type: Number,
            default: 0,
            description: 'Number of admin registrations allowed. 0 means admin can register'
        },
        maxAdmins: {
            type: Number,
            default: 1,
            description: 'Maximum number of admins allowed'
        },
        adminCount: {
            type: Number,
            default: 0,
            description: 'Current number of registered admins'
        }
    },
    {
        timestamps: true
    }
);

const AdminRegistration = mongoose.model('AdminRegistration', adminRegistrationSchema);

export default AdminRegistration;
