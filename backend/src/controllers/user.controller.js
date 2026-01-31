const express = require("express");
const router = express.Router();
const levelService = require("../services/level.service");
const User = require("../models/user.model");

// Get user level and XP details
router.get("/level/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        const levelData = await levelService.calculateUserLevel(userId);
        
        // Get current progress to next level
        const currentLevelXP = levelData.xpForCurrentLevel;
        const nextLevelXP = levelData.xpForNextLevel;
        const xpInCurrentLevel = levelData.xp - currentLevelXP;
        const xpNeededForNext = nextLevelXP - currentLevelXP;
        const progressPercent = Math.floor((xpInCurrentLevel / xpNeededForNext) * 100);
        
        res.status(200).json({
            level: levelData.level,
            xp: levelData.xp,
            xpForNextLevel: nextLevelXP,
            xpForCurrentLevel: currentLevelXP,
            progress: `${xpInCurrentLevel}/${xpNeededForNext} XP`,
            progressPercent,
            breakdown: levelData.breakdown
        });
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get user stats (level, streak, logins)
router.get("/stats/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        
        const levelData = await levelService.calculateUserLevel(userId);
        
        // Calculate streak
        const streakXP = await levelService.calculateStreakXP(userId);
        const currentStreak = Math.floor(Math.sqrt(streakXP / 20)); // Reverse formula
        
        res.status(200).json({
            username: user.username,
            level: levelData.level,
            xp: levelData.xp,
            score: user.score,
            streak: currentStreak,
            loginStreak: user.loginStreak || 0,
            totalLogins: user.totalLogins || 0,
            lastLogin: user.lastLogin,
            lastActivity: user.lastActivity
        });
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Force update user level (useful for maintenance)
router.post("/update-level/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        const levelData = await levelService.updateUserLevel(userId);
        
        res.status(200).json({
            message: "Level updated successfully",
            level: levelData.level,
            xp: levelData.xp
        });
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Check decay for inactive users
router.get("/check-decay/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        const now = new Date();
        const lastActivity = user.lastActivity ? new Date(user.lastActivity) : now;
        const daysInactive = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
        
        const levelData = await levelService.calculateUserLevel(userId);
        const decayXP = levelData.breakdown.decayXP;
        
        let status = "active";
        let message = "User is active";
        
        if (daysInactive > 2) {
            if (daysInactive <= 7) {
                status = "mild_decay";
                message = `User inactive for ${daysInactive} days. Losing -1% XP per day`;
            } else if (daysInactive <= 14) {
                status = "medium_decay";
                message = `User inactive for ${daysInactive} days. Losing -3% XP per day`;
            } else if (daysInactive <= 30) {
                status = "heavy_decay";
                message = `User inactive for ${daysInactive} days. Losing -5% XP per day`;
            } else {
                status = "severe_decay";
                message = `User inactive for ${daysInactive} days. Lost 75% of XP`;
            }
        }
        
        res.status(200).json({
            status,
            message,
            daysInactive,
            decayXP,
            currentXP: levelData.xp,
            currentLevel: levelData.level
        });
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get top 5 users by XP (Leaderboard)
router.get("/leaderboard/top5", async (req, res) => {
    try {
        const topUsers = await User.find()
            .select('username xp level score')
            .sort({ xp: -1 })
            .limit(5)
            .lean();
        
        const leaderboard = topUsers.map((user, index) => ({
            rank: index + 1,
            username: user.username,
            xp: user.xp || 0,
            level: user.level || 1,
            score: user.score || 0
        }));
        
        res.status(200).json(leaderboard);
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
