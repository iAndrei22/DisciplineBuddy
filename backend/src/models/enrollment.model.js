const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    status: { 
        type: String, 
        enum: ['in-progress', 'completed'], 
        default: 'in-progress' 
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
}, { timestamps: true });

// Compound index to prevent duplicate enrollments
EnrollmentSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
