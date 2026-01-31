const User = require('../models/user.model');
const Task = require('../models/task.model');

// Calculate XP required for a specific level
const xpForLevel = (level) => {
    // Modified to start Level 1 at 0 XP instead of 100 XP
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(level - 1, 1.5));
};

// Get level from total XP
const getLevelFromXP = (xp) => {
    let level = 1;
    while (xpForLevel(level + 1) <= xp) {
        level++;
    }
    return level;
};

// Calculate Task XP (60% weight)
const calculateTaskXP = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return 0;
    
    // Task XP = score × 10
    return user.score * 10;
};

// Calculate Streak XP (25% weight)
const calculateStreakXP = async (userId) => {
    // Get current streak
    const completedTasks = await Task.find({ 
        userId, 
        isCompleted: true, 
        completedAt: { $ne: null } 
    }).select('completedAt');
    
    if (!completedTasks.length) return 0;

    const dateSet = new Set(
        completedTasks.map(t => new Date(t.completedAt))
            .map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10))
    );

    let streak = 0;
    let cursor = new Date();
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());

    while (true) {
        const key = cursor.toISOString().slice(0,10);
        if (dateSet.has(key)) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        } else {
            break;
        }
    }

    // Streak XP = streak² × 20
    return Math.pow(streak, 2) * 20;
};

// Calculate Login XP (15% weight)
const calculateLoginXP = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return 0;
    
    const loginXP = (user.totalLogins || 0) * 50;
    
    return loginXP;
};

// Calculate Decay XP (penalty for inactivity)
const calculateDecayXP = (totalXP, lastActivity) => {
    if (!lastActivity) return 0;
    
    const now = new Date();
    const lastActivityDate = new Date(lastActivity);
    const daysInactive = Math.floor((now - lastActivityDate) / (1000 * 60 * 60 * 24));
    
    // Grace period: 2 days
    if (daysInactive <= 2) return 0;
    
    const daysAfterGrace = daysInactive - 2;
    let decayXP = 0;
    
    if (daysInactive <= 7) {
        // Mild decay: -1% per day
        decayXP = totalXP * 0.01 * daysAfterGrace;
    } else if (daysInactive <= 14) {
        // Medium decay: -3% per day
        decayXP = totalXP * 0.03 * daysAfterGrace;
    } else if (daysInactive <= 30) {
        // Heavy decay: -5% per day
        decayXP = totalXP * 0.05 * daysAfterGrace;
    } else {
        // After 30 days: lose 75% of XP
        decayXP = totalXP * 0.75;
    }
    
    return Math.floor(decayXP);
};

// Calculate total XP and level for a user
const calculateUserLevel = async (userId) => {
    const taskXP = await calculateTaskXP(userId);
    const streakXP = await calculateStreakXP(userId);
    const loginXP = await calculateLoginXP(userId);
    
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const totalBeforeDecay = taskXP + streakXP + loginXP;
    const decayXP = calculateDecayXP(totalBeforeDecay, user.lastActivity);
    
    const totalXP = Math.max(0, totalBeforeDecay - decayXP);
    const level = getLevelFromXP(totalXP);
    
    return {
        xp: totalXP,
        level,
        xpForNextLevel: xpForLevel(level + 1),
        xpForCurrentLevel: xpForLevel(level),
        breakdown: {
            taskXP,
            streakXP,
            loginXP,
            decayXP,
            totalBeforeDecay
        }
    };
};

// Update user's XP and level in database
const updateUserLevel = async (userId) => {
    const userBefore = await User.findById(userId).select('level');
    const previousLevel = userBefore ? (userBefore.level || 1) : 1;
    const levelData = await calculateUserLevel(userId);
    
    await User.findByIdAndUpdate(userId, {
        xp: levelData.xp,
        level: levelData.level,
        lastActivity: new Date()
    });

    if (levelData.level !== previousLevel) {
        const { checkAndAssignBadges } = require('./task.service');
        await checkAndAssignBadges(userId);
    }
    
    return levelData;
};

// Update login tracking
const updateLoginTracking = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const now = new Date();
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    
    let loginStreak = user.loginStreak || 0;
    let shouldUpdateStats = true;
    
    if (lastLogin) {
        // Check if same calendar day (UTC)
        // This prevents XP abuse by logging in multiple times a day
        const isSameDay = now.toISOString().slice(0,10) === lastLogin.toISOString().slice(0,10);
        
        if (isSameDay) {
            shouldUpdateStats = false;
        } else {
            // Check for consecutive day
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            
            // Check if last login was yesterday
            const isConsecutive = lastLogin.toISOString().slice(0,10) === yesterday.toISOString().slice(0,10);
            
            if (isConsecutive) {
                loginStreak += 1;
            } else {
                loginStreak = 1; // Streak broken
            }
        }
    } else {
        // First login ever
        loginStreak = 1;
    }
    
    const updateData = {
        lastLogin: now
    };
    
    if (shouldUpdateStats) {
        updateData.totalLogins = (user.totalLogins || 0) + 1;
        updateData.loginStreak = loginStreak;
    }
    
    await User.findByIdAndUpdate(userId, updateData);
    
    // Fetch updated user to return correct stats or return calculated ones
    // Returning calculated ones to save a query
    return { 
        loginStreak: shouldUpdateStats ? loginStreak : user.loginStreak, 
        totalLogins: shouldUpdateStats ? ((user.totalLogins || 0) + 1) : (user.totalLogins || 0) 
    };
};

module.exports = {
    xpForLevel,
    getLevelFromXP,
    calculateTaskXP,
    calculateStreakXP,
    calculateLoginXP,
    calculateDecayXP,
    calculateUserLevel,
    updateUserLevel,
    updateLoginTracking
};
