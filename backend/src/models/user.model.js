const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'coach', 'admin'], default: 'user' },
    enrolledChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
});

module.exports = mongoose.model('User', userSchema);