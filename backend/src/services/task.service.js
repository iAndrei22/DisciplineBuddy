const Task = require('../models/task.model');

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

    // Update completion flag
    const updated = await Task.findByIdAndUpdate(
        taskId,
        { isCompleted },
        { new: true }
    );

    // Gamification: adjust user score based on completion change
    try {
        const User = require('../models/user.model');
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
        }
    } catch (e) {
        // Log but don't fail the toggle operation
        console.error('Score update error:', e.message);
    }

    return updated;
};

module.exports = {
    createTask,
    getUserTasks,
    deleteTask,
    toggleTaskCompletion
};