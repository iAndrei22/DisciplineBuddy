const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'User' },
    score: { type: Number, default: 0 },
    
    // Level system
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    
    // Login tracking
    lastLogin: { type: Date, default: null },
    loginStreak: { type: Number, default: 0 },
    totalLogins: { type: Number, default: 0 },
    
    // Activity tracking
    lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);