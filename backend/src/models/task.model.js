const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Opțional - null pentru task-uri template
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }, // Opțional - legătura cu challenge-ul
    title: { type: String, required: true },
    description: { type: String, required: true },
    points: { type: Number, default: 10 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
