const mongoose = require('mongoose');

const CATEGORIES = [
    'Fitness & Health',
    'Mindfulness & Meditation',
    'Productivity',
    'Learning & Education',
    'Finance & Savings',
    'Social & Relationships',
    'Creativity',
    'Career & Professional',
    'Habits & Routines',
    'Wellness & Self-Care'
];

const ParticipantSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
}, { _id: false });

const ChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    durationDays: { type: Number, default: 7 },
    category: { type: String, enum: CATEGORIES, default: 'Habits & Routines' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [ParticipantSchema],
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], // Task-uri template ale challenge-ului
}, { timestamps: true });

module.exports = mongoose.model('Challenge', ChallengeSchema);
module.exports.CATEGORIES = CATEGORIES;
