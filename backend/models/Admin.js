import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        default: 'admin@gmail.com'
    },
    password: {
        type: String,
        required: true,
        default: 'admin123'
    },
    role: {
        type: String,
        default: 'admin'
    },
    fullName: {
        type: String,
        default: 'Administrator'
    }
}, {
    timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
