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
    
    // Update and return the new version of the document
    return await Task.findByIdAndUpdate(
        taskId, 
        { isCompleted }, 
        { new: true }
    );
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