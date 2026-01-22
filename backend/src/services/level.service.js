const User = require('../models/user.model');
const Task = require('../models/task.model');

// Calculate XP required for a specific level
const xpForLevel = (level) => {
    return Math.floor(100 * Math.pow(level, 1.5));
};

// Get level from total XP
const getLevelFromXP = (xp) => {
    let level = 1;
    while (xpForLevel(level + 1) <= xp) {
        level++;
    }
    console.log(`[LEVEL CALC] XP: ${xp}, Level: ${level}, xpForCurrentLevel: ${xpForLevel(level)}, xpForNextLevel: ${xpForLevel(level + 1)}`);
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
    console.log(`[LOGIN XP] User ${userId}: totalLogins = ${user.totalLogins || 0}, loginXP = ${loginXP}`);
    
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
    const levelData = await calculateUserLevel(userId);
    
    await User.findByIdAndUpdate(userId, {
        xp: levelData.xp,
        level: levelData.level,
        lastActivity: new Date()
    });
    
    return levelData;
};

// Update login tracking
const updateLoginTracking = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const now = new Date();
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    
    let loginStreak = user.loginStreak || 0;
    let shouldUpdateStreak = true;
    
    if (lastLogin) {
        // Calculate days between logins
        const daysSinceLastLogin = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastLogin === 0) {
            // Same day login - don't update streak, but still increment totalLogins
            shouldUpdateStreak = false;
        } else if (daysSinceLastLogin === 1) {
            // Consecutive day - increase streak
            loginStreak += 1;
        } else {
            // Streak broken - reset to 1
            loginStreak = 1;
        }
    } else {
        // First login ever
        loginStreak = 1;
    }
    
    const newTotalLogins = (user.totalLogins || 0) + 1;
    console.log(`[LOGIN TRACKING] User ${userId}: totalLogins ${user.totalLogins || 0} -> ${newTotalLogins}, loginStreak: ${shouldUpdateStreak ? loginStreak : user.loginStreak || 0}`);
    
    const updateData = {
        totalLogins: newTotalLogins,
        lastLogin: now
    };
    
    if (shouldUpdateStreak) {
        updateData.loginStreak = loginStreak;
    }
    
    await User.findByIdAndUpdate(userId, updateData);
    
    // Fetch updated user to confirm totalLogins was incremented
    const updatedUser = await User.findById(userId);
    console.log(`[LOGIN TRACKING] Updated user totalLogins from DB: ${updatedUser.totalLogins}, loginStreak: ${updatedUser.loginStreak}`);
    
    return { loginStreak: updatedUser.loginStreak, totalLogins: updatedUser.totalLogins };
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
