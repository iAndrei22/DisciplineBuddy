
const Task = require('../models/task.model');
const User = require('../models/user.model');
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
    });

    if (earned.length > 0) {
        user.badges.push(...earned);
        await user.save();
    }
}

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

    return task;
};

// 2. Get all tasks for a specific user
const getUserTasks = async (userId) => {
    if (!userId) {
        throw new Error("User ID is required to fetch tasks.");
    }

    // Find tasks by userId and sort by newest first
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    return tasks;
};

// 3. Delete a task
const deleteTask = async (taskId) => {
    if (!taskId) {
        throw new Error("Task ID is required.");
    }
    return await Task.findByIdAndDelete(taskId);
};

// 4. Update task status (Completed/Not Completed)

const toggleTaskCompletion = async (taskId, isCompleted) => {
    if (!taskId) {
        throw new Error("Task ID is required.");
    }
    
    // Find current task to determine score delta
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

    // Gamification: adjust user score based on completion change
    try {
        let delta = 0;
        if (!current.isCompleted && isCompleted) {
            // Marked as done -> add points
            delta = current.points || 10;
        } else if (current.isCompleted && !isCompleted) {
            // Marked as undone -> remove points
            delta = -(current.points || 10);
        }
        if (delta !== 0) {
            await User.findByIdAndUpdate(current.userId, { $inc: { score: delta } });
            // Update user level and XP after score change
            await levelService.updateUserLevel(current.userId);
        }
    } catch (e) {
        // Log but don't fail the toggle operation
        console.error('Score update error:', e.message);
    }

    // If completed, check for badges
    if (updated && isCompleted) {
        await checkAndAssignBadges(updated.userId);
    }
    return updated;
};


// 5. Edit task (update any field)
const editTask = async (taskId, updateFields) => {
    if (!taskId) throw new Error("Task ID is required.");
    return await Task.findByIdAndUpdate(taskId, updateFields, { new: true });
};



module.exports = {
    createTask,
    getUserTasks,
    deleteTask,
    toggleTaskCompletion,
    editTask
};