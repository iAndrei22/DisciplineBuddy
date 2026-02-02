
const Task = require('../models/task.model');
const User = require('../models/user.model');
const Challenge = require('../models/challenge.model');
const levelService = require('./level.service');
const path = require('path');
const fs = require('fs');

// Load badges config
const badgesPath = path.join(__dirname, '../badges.json');
const BADGES = JSON.parse(fs.readFileSync(badgesPath, 'utf8'));

// Helper: Check and assign badges to user
async function checkAndAssignBadges(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    // Get user stats
    const tasks = await Task.find({ userId });
    const completedTasks = tasks.filter(t => t.isCompleted);
    const totalPoints = completedTasks.reduce((sum, t) => sum + (t.points || 0), 0);

    // Early Bird: complete at least one task before 8:00
    const hasEarlyBird = completedTasks.some(t => {
        if (!t.updatedAt) return false;
        const date = new Date(t.updatedAt);
        return date.getHours() < 8;
    });

    // Build badge checks
    const earned = [];
    BADGES.forEach(badge => {
        if (user.badges.includes(badge.id)) return;
        if (badge.type === 'points' && totalPoints >= badge.milestone) earned.push(badge.id);
        if (badge.type === 'tasks_completed' && completedTasks.length >= badge.milestone) earned.push(badge.id);
        if (badge.type === 'early_task' && hasEarlyBird) earned.push(badge.id);
        if (badge.type === 'level' && (user.level || 1) >= badge.milestone) earned.push(badge.id);
        if (badge.type === 'challenges_completed' && (user.completedChallenges || 0) >= badge.milestone) earned.push(badge.id);
    });

    if (earned.length > 0) {
        user.badges.push(...earned);
        await user.save();
    }
}

// Helper: Recalculate user score from scratch to ensure consistency
const recalculateUserScore = async (userId) => {
    try {
        const tasks = await Task.find({ userId, isCompleted: true });
        const realScore = tasks.reduce((sum, t) => sum + (t.points || 0), 0);
        
        await User.findByIdAndUpdate(userId, { score: realScore });
        // Update user level and XP based on the new correct score
        await levelService.updateUserLevel(userId);
    } catch (error) {
        console.error("Error recalculating score:", error);
    }
};

// Service to handle Task logic

// 1. Create a new task
const createTask = async (userId, title, description, points) => {
    // Validation: Ensure required fields are present
    if (!userId) throw new Error("User ID is required.");
    if (!title || title.trim() === "") throw new Error("Task title cannot be empty.");
    if (!description || description.trim() === "") throw new Error("Task description cannot be empty.");


    // Create and save to MongoDB
    const task = await Task.create({
        userId,
        title,
        description,
        points: points || 10,
        isCompleted: false
    });
    
    // No need to recalculate score on create (incomplete by default)
    return task;
};

// 2. Get all tasks for a specific user
const getUserTasks = async (userId) => {
    if (!userId) {
        throw new Error("User ID is required to fetch tasks.");
    }

    // Find tasks by userId and sort by newest first
    // Populate challengeId with challenge info (title, description, createdBy)
    const tasks = await Task.find({ userId })
        .sort({ createdAt: -1 })
        .populate({
            path: 'challengeId',
            select: 'title description createdBy',
            populate: {
                path: 'createdBy',
                select: 'username'
            }
        });
    return tasks;
};

// 3. Delete a task
const deleteTask = async (taskId) => {
    if (!taskId) {
        throw new Error("Task ID is required.");
    }
    const deletedTask = await Task.findByIdAndDelete(taskId);
    
    if (deletedTask) {
        // If we deleted a task, score might change (if it was completed)
        await recalculateUserScore(deletedTask.userId);
    }
    
    return deletedTask;
};

// 4. Update task status (Completed/Not Completed)

const toggleTaskCompletion = async (taskId, isCompleted) => {
    if (!taskId) {
        throw new Error("Task ID is required.");
    }
    
    // Find current task
    const current = await Task.findById(taskId);
    if (!current) throw new Error("Task not found.");

    // Update completion flag and completedAt date
    const updateData = { isCompleted };
    if (isCompleted) {
        updateData.completedAt = new Date();
    }
    // Note: if unchecking, completedAt stays but will be updated on next completion

    const updated = await Task.findByIdAndUpdate(
        taskId,
        updateData,
        { new: true }
    );

    // Gamification: ALWAYS recalculate from scratch to be safe
    if (updated) {
        await recalculateUserScore(updated.userId);
        
        // If completed, check for badges
        if (isCompleted) {
            await checkAndAssignBadges(updated.userId);
        }

        // Check if this task belongs to a challenge and update challenge status
        if (updated.challengeId && updated.userId) {
            await checkAndUpdateChallengeStatus(updated.userId, updated.challengeId);
        }
    }

    return updated;
};

// Helper: Check if all tasks of a challenge are completed and update challenge status
const checkAndUpdateChallengeStatus = async (userId, challengeId) => {
    try {
        console.log(`\n=== CHECK CHALLENGE STATUS ===`);
        console.log(`User: ${userId}, Challenge: ${challengeId}`);
        
        // Get all user tasks for this challenge
        const userChallengeTasks = await Task.find({ 
            userId: userId, 
            challengeId: challengeId 
        });

        console.log(`Found ${userChallengeTasks.length} user tasks for this challenge`);
        
        if (userChallengeTasks.length === 0) {
            console.log('No tasks found, returning');
            return;
        }

        const allCompleted = userChallengeTasks.every(t => t.isCompleted);
        const completedCount = userChallengeTasks.filter(t => t.isCompleted).length;
        console.log(`Completed: ${completedCount}/${userChallengeTasks.length}, All completed: ${allCompleted}`);

        // Get the challenge and find user's participation
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            console.log('Challenge not found!');
            return;
        }

        const participant = challenge.participants.find(p => {
            const oderId = p.user._id ? p.user._id.toString() : p.user.toString();
            return oderId === userId.toString();
        });

        if (!participant) {
            console.log('Participant not found in challenge!');
            console.log('Challenge participants:', challenge.participants.map(p => p.user.toString()));
            return;
        }

        const previousStatus = participant.status;
        let newStatus = 'in-progress';

        if (allCompleted) {
            newStatus = 'completed';
        }

        console.log(`Previous status: ${previousStatus}, New status: ${newStatus}`);

        // Only update if status changed
        if (previousStatus !== newStatus) {
            console.log('Status changed! Updating...');
            participant.status = newStatus;
            
            if (newStatus === 'completed') {
                participant.completedAt = new Date();
                // Award XP for completing challenge
                await User.findByIdAndUpdate(userId, { $inc: { completedChallenges: 1 } });
                console.log(`🎉 User ${userId} completed challenge ${challengeId}! Awarding XP...`);
            } else if (previousStatus === 'completed' && newStatus !== 'completed') {
                // User unchecked a task, remove completion
                participant.completedAt = null;
                const user = await User.findById(userId).select('completedChallenges');
                const currentCount = user ? (user.completedChallenges || 0) : 0;
                await User.findByIdAndUpdate(userId, { 
                    completedChallenges: Math.max(0, currentCount - 1) 
                });
                console.log(`User ${userId} uncompleted challenge ${challengeId}`);
            }

            await challenge.save();
            console.log('Challenge saved with new participant status');

            // Update user level/XP
            console.log('Calling levelService.updateUserLevel...');
            await levelService.updateUserLevel(userId);
            console.log('Level updated!');
            
            // Check for badges
            await checkAndAssignBadges(userId);
        }
    } catch (error) {
        console.error("Error checking challenge status:", error);
    }
};


// 5. Edit task (update any field)
const editTask = async (taskId, updateFields) => {
    if (!taskId) throw new Error("Task ID is required.");
    const updated = await Task.findByIdAndUpdate(taskId, updateFields, { new: true });
    
    if (updated) {
        // Points might have changed, recalculate
        await recalculateUserScore(updated.userId);
    }
    
    return updated;
};



module.exports = {
    createTask,
    getUserTasks,
    deleteTask,
    toggleTaskCompletion,
    editTask,
    checkAndAssignBadges
};